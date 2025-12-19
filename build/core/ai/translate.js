"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Translate = void 0;
const crypto_1 = __importDefault(require("crypto"));
const discord_js_1 = __importDefault(require("discord.js"));
const langdetect_1 = __importDefault(require("langdetect"));
const bot_1 = __importDefault(require("../../bot"));
const logger_1 = require("../../utils/logger");
const user_data_1 = __importDefault(require("../../events/database/schema/user_data"));
const schema_1 = require("./schema");
const translation_cache_1 = __importDefault(require("../../events/database/schema/translation_cache"));
class Translate {
    constructor(ai) {
        this.ai = ai;
        this.generateCacheKey = (input, targetLang) => {
            const normalized = `${input.trim().toLowerCase()}:${targetLang.toLowerCase()}`;
            return crypto_1.default.createHash('sha256').update(normalized).digest('hex');
        };
        this.getCachedTranslation = async (cacheKey) => {
            try {
                const cached = await translation_cache_1.default.findOne({ cacheKey }).lean();
                if (cached) {
                    bot_1.default.logger.debug(`[AI_TRANSLATE] Cache hit for key: ${cacheKey.substring(0, 8)}...`);
                    return cached.translatedText;
                }
                return null;
            }
            catch (error) {
                bot_1.default.logger.error(`[AI_TRANSLATE] Error reading cache: ${error}`);
                return null;
            }
        };
        this.setCachedTranslation = async (cacheKey, inputText, targetLang, translatedText) => {
            try {
                await translation_cache_1.default.findOneAndUpdate({ cacheKey }, { cacheKey, inputText: inputText.substring(0, 500), targetLang, translatedText, createdAt: new Date() }, { upsert: true, new: true });
                bot_1.default.logger.debug(`[AI_TRANSLATE] Cached translation for key: ${cacheKey.substring(0, 8)}...`);
            }
            catch (error) {
                bot_1.default.logger.error(`[AI_TRANSLATE] Error writing cache: ${error}`);
            }
        };
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
        this.language_detect = async (text, userLang) => {
            try {
                const langCode = langdetect_1.default.detectOne(text);
                const langNames = new Intl.DisplayNames([userLang], { type: 'language' });
                const result = langNames.of(langCode) || langCode;
                return `**${result}** (${langCode})` || 'unknown';
            }
            catch (error) {
                bot_1.default.logger.error(`[AI_TRANSLATE] Error detecting language: ${error}`);
                return 'unknown';
            }
        };
        this.invoke = async (input, targetLang, retry = 5) => {
            const cacheKey = this.generateCacheKey(input, targetLang);
            const cachedResult = await this.getCachedTranslation(cacheKey);
            if (cachedResult)
                return { text: cachedResult };
            const systemPrompt = `You are a helpful translation assistant. Translate the user's text to ${targetLang} and respond only with a JSON object matching the schema: "{ \"text\": \"...translated text...\" }". Do not include any additional explanation. Be smart to identify the context and nuances of the text. If the text has a name, make sure to translate it to ${targetLang} without altering the pronunciation. When a word or phrase has multiple valid meanings or translations that could apply in the given context, present them separated by '/' (e.g., he/she, bank/shore, light/bright). Only use this format when the ambiguity is genuinely relevant to the context.`;
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: input },
            ];
            let attempt = 0;
            let lastErr = null;
            while (attempt < retry) {
                attempt++;
                try {
                    const response = await this.ai.invoke(messages, bot_1.default.config.ai.translate_model, { response_format: { type: 'json_object' } });
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
                    await this.setCachedTranslation(cacheKey, input, targetLang, result.text);
                    (0, logger_1.webhookLog)(new discord_js_1.default.EmbedBuilder()
                        .setTitle('Translation Successful')
                        .setColor('#00ff00')
                        .addFields({ name: 'Target Language', value: `\`${targetLang}\``, inline: true }, { name: 'Attempts', value: attempt.toString(), inline: true }, { name: 'Cache Key', value: `\`${cacheKey}\``, inline: false }, { name: 'Input (truncated)', value: input.length > 1000 ? input.substring(0, 1000) + '...' : input, inline: false }, { name: 'Output (truncated)', value: result.text.length > 1000 ? result.text.substring(0, 1000) + '...' : result.text, inline: false })
                        .setTimestamp());
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
