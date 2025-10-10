"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Translate = void 0;
const langdetect = __importStar(require("langdetect"));
const bot_1 = __importDefault(require("../../bot"));
const user_data_1 = __importDefault(require("../../events/database/schema/user_data"));
const schema_1 = require("./schema");
class Translate {
    constructor(ai) {
        this.ai = ai;
        this.validateUserData = async (userId) => {
            try {
                if (!userId)
                    return false;
                const user = await user_data_1.default.findOne({ userId }).lean();
                return !!user;
            }
            catch (error) {
                bot_1.default.logger.error(`[AI_TRANSLATE] Error validating user data for ${userId}: ${error}`);
                return false;
            }
        };
        this.setup = async (userId, targetLang) => {
            try {
                if (!userId)
                    throw new Error('userId is required');
                const exists = await this.validateUserData(userId);
                await user_data_1.default.findOneAndUpdate({ userId }, { language: targetLang }, { upsert: true, new: true });
                if (exists) {
                    bot_1.default.logger.info(`[AI_TRANSLATE] Updated language for existing user ${userId} -> ${targetLang}`);
                }
                else {
                    bot_1.default.logger.info(`[AI_TRANSLATE] Set language for new user ${userId} -> ${targetLang}`);
                }
            }
            catch (error) {
                bot_1.default.logger.error(`[AI_TRANSLATE] Error setting up user ${userId} language to ${targetLang}: ${error}`);
                throw new Error(error?.message ?? String(error));
            }
        };
        this.getlang = async (userId) => {
            try {
                if (!userId)
                    throw new Error('userId is required');
                const user = await user_data_1.default.findOne({ userId }).lean();
                return user?.language || null;
            }
            catch (error) {
                bot_1.default.logger.error(`[AI_TRANSLATE] Error retrieving language for user ${userId}: ${error}`);
                throw new Error(error?.message ?? String(error));
            }
        };
        this.language_detect = async (text) => {
            try {
                const detectedResults = langdetect.detect(text);
                const detected = Array.isArray(detectedResults) && detectedResults.length > 0 ? detectedResults[0] : null;
                const detected_lang = detected ? detected.lang : 'unknown';
                bot_1.default.logger.debug(`[NON-AI] Detected language: ${detected_lang} (confidence: ${detected?.prob})`);
                return detected_lang;
            }
            catch (error) {
                bot_1.default.logger.error(`[NON-AI] Error detecting language: ${error}`);
                return 'unknown';
            }
        };
        this.invoke = async (input, targetLang, retry = 5) => {
            const messages = [
                { role: 'system', content: `You are a helpful translation assistant. Translate the user's text to ${targetLang} and respond only with a JSON object matching the schema: "{ \"text\": \"...translated text...\" }". Do not include any additional explanation.` },
                { role: 'user', content: input },
            ];
            let attempt = 0;
            let lastErr = null;
            while (attempt < retry) {
                attempt++;
                try {
                    const response = await this.ai.invoke(messages, bot_1.default.config.ai.translate_model, { response_format: { type: 'json_object' } }); //response_format: { type: 'json_schema', json_schema: { name: 'translation_response', schema: z.toJSONSchema(translationResponseSchema) } } });
                    const content = response?.choices?.[0]?.message?.content;
                    if (!content || typeof content !== 'string')
                        throw new Error('Empty response content');
                    let parsed = null;
                    try {
                        parsed = JSON.parse(content);
                    }
                    catch (e) {
                        const match = content.match(/\{[\s\S]*\}/);
                        if (match) {
                            try {
                                parsed = JSON.parse(match[0]);
                            }
                            catch (e2) {
                                throw new Error('Failed to parse JSON from model response');
                            }
                        }
                        else {
                            throw new Error('No JSON object found in model response');
                        }
                    }
                    const result = schema_1.translationResponseSchema.parse(parsed);
                    return result;
                }
                catch (err) {
                    lastErr = err;
                    bot_1.default.logger.warn(`[AI_TRANSLATE] Attempt ${attempt} failed: ${err?.message ?? String(err)}`);
                    if (attempt >= retry)
                        break;
                    const baseDelay = 500;
                    const backoff = baseDelay * Math.pow(2, attempt - 1);
                    const jitter = Math.floor(Math.random() * 300);
                    const delay = backoff + jitter;
                    await new Promise((res) => setTimeout(res, delay));
                }
            }
            bot_1.default.logger.error(`[AI_TRANSLATE] All ${retry} attempts failed translating to ${targetLang}: ${lastErr}`);
            throw new Error(`Translation failed after ${retry} attempts: ${lastErr?.message ?? String(lastErr)}`);
        };
    }
}
exports.Translate = Translate;
