"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Translate = void 0;
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
