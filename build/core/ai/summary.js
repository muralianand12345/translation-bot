"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Summary = void 0;
const crypto_1 = __importDefault(require("crypto"));
const bot_1 = __importDefault(require("../../bot"));
const schema_1 = require("./schema");
const summary_cache_1 = __importDefault(require("../../events/database/schema/summary_cache"));
class Summary {
    constructor(ai) {
        this.ai = ai;
        this.generateCacheKey = (input, targetLang) => {
            const normalized = `${input.trim().toLowerCase()}:${targetLang.toLowerCase()}`;
            return crypto_1.default.createHash('sha256').update(normalized).digest('hex');
        };
        this.getCachedSummary = async (cacheKey) => {
            try {
                const cached = await summary_cache_1.default.findOne({ cacheKey }).lean();
                if (cached) {
                    bot_1.default.logger.debug(`[AI_SUMMARY] Cache hit for key: ${cacheKey.substring(0, 8)}...`);
                    return cached.summaryText;
                }
                return null;
            }
            catch (error) {
                bot_1.default.logger.error(`[AI_SUMMARY] Error reading cache: ${error}`);
                return null;
            }
        };
        this.setCachedSummary = async (cacheKey, inputText, targetLang, summaryText) => {
            try {
                await summary_cache_1.default.findOneAndUpdate({ cacheKey }, { cacheKey, inputText: inputText.substring(0, 500), targetLang, summaryText, createdAt: new Date() }, { upsert: true, new: true });
                bot_1.default.logger.debug(`[AI_SUMMARY] Cached summary for key: ${cacheKey.substring(0, 8)}...`);
            }
            catch (error) {
                bot_1.default.logger.error(`[AI_SUMMARY] Error writing cache: ${error}`);
            }
        };
        this.invoke = async (input, targetLang, retry = 5) => {
            const cacheKey = this.generateCacheKey(input, targetLang);
            const cachedResult = await this.getCachedSummary(cacheKey);
            if (cachedResult)
                return { summary: cachedResult };
            const systemPrompt = `You are a helpful summarization assistant. Summarize the user's text concisely in ${targetLang}. Capture the key points and main ideas while keeping the summary brief and clear. Respond only with a JSON object matching the schema: { "summary": "...summarized text..." }. Do not include any additional explanation.`;
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: input },
            ];
            let attempt = 0;
            let lastErr = null;
            while (attempt < retry) {
                attempt++;
                try {
                    const response = await this.ai.invoke(messages, bot_1.default.config.ai.summary_model, {
                        response_format: {
                            type: 'json_schema',
                            json_schema: {
                                name: 'summary_response',
                                strict: true,
                                schema: {
                                    type: 'object',
                                    properties: {
                                        summary: { type: 'string' },
                                    },
                                    required: ['summary'],
                                    additionalProperties: false,
                                },
                            },
                        },
                    });
                    const content = response?.choices?.[0]?.message?.content;
                    if (!content || typeof content !== 'string')
                        throw new Error('Empty response content');
                    const parsed = JSON.parse(content);
                    const result = schema_1.summaryResponseSchema.parse(parsed);
                    await this.setCachedSummary(cacheKey, input, targetLang, result.summary);
                    return result;
                }
                catch (err) {
                    lastErr = err;
                    bot_1.default.logger.warn(`[AI_SUMMARY] Attempt ${attempt} failed: ${err?.message ?? String(err)}`);
                    if (attempt >= retry)
                        break;
                    const baseDelay = 500;
                    const backoff = baseDelay * Math.pow(2, attempt - 1);
                    const jitter = Math.floor(Math.random() * 300);
                    const delay = backoff + jitter;
                    await new Promise((res) => setTimeout(res, delay));
                }
            }
            bot_1.default.logger.error(`[AI_SUMMARY] All ${retry} attempts failed summarizing to ${targetLang}: ${lastErr}`);
            throw new Error(`Summary failed after ${retry} attempts: ${lastErr?.message ?? String(lastErr)}`);
        };
    }
}
exports.Summary = Summary;
