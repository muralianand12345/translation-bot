import crypto from 'crypto';

import { AI } from './index';
import client from '../../bot';
import { summaryResponseSchema, SummaryResponse } from './schema';
import summaryCache from '../../events/database/schema/summary_cache';

export class Summary {
	constructor(private ai: AI) {}

	private generateCacheKey = (input: string, targetLang: string): string => {
		const normalized = `${input.trim().toLowerCase()}:${targetLang.toLowerCase()}`;
		return crypto.createHash('sha256').update(normalized).digest('hex');
	};

	private getCachedSummary = async (cacheKey: string): Promise<string | null> => {
		try {
			const cached = await summaryCache.findOne({ cacheKey }).lean();
			if (cached) {
				client.logger.debug(`[AI_SUMMARY] Cache hit for key: ${cacheKey.substring(0, 8)}...`);
				return cached.summaryText;
			}
			return null;
		} catch (error) {
			client.logger.error(`[AI_SUMMARY] Error reading cache: ${error}`);
			return null;
		}
	};

	private setCachedSummary = async (cacheKey: string, inputText: string, targetLang: string, summaryText: string): Promise<void> => {
		try {
			await summaryCache.findOneAndUpdate({ cacheKey }, { cacheKey, inputText: inputText.substring(0, 500), targetLang, summaryText, createdAt: new Date() }, { upsert: true, new: true });
			client.logger.debug(`[AI_SUMMARY] Cached summary for key: ${cacheKey.substring(0, 8)}...`);
		} catch (error) {
			client.logger.error(`[AI_SUMMARY] Error writing cache: ${error}`);
		}
	};

	invoke = async (input: string, targetLang: string, retry: number = 5): Promise<SummaryResponse> => {
		const cacheKey = this.generateCacheKey(input, targetLang);
		const cachedResult = await this.getCachedSummary(cacheKey);
		if (cachedResult) return { summary: cachedResult };

		const systemPrompt = `You are a helpful summarization assistant. Summarize the user's text concisely in ${targetLang}. Capture the key points and main ideas while keeping the summary brief and clear. Respond only with a JSON object matching the schema: { "summary": "...summarized text..." }. Do not include any additional explanation.`;
		const messages = [
			{ role: 'system' as const, content: systemPrompt },
			{ role: 'user' as const, content: input },
		];

		let attempt = 0;
		let lastErr: any = null;

		while (attempt < retry) {
			attempt++;
			try {
				const response = await this.ai.invoke(messages, client.config.ai.summary_model, {
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
				if (!content || typeof content !== 'string') throw new Error('Empty response content');

				const parsed = JSON.parse(content);
				const result = summaryResponseSchema.parse(parsed);

				await this.setCachedSummary(cacheKey, input, targetLang, result.summary);
				return result;
			} catch (err: any) {
				lastErr = err;
				client.logger.warn(`[AI_SUMMARY] Attempt ${attempt} failed: ${err?.message ?? String(err)}`);
				if (attempt >= retry) break;
				const baseDelay = 500;
				const backoff = baseDelay * Math.pow(2, attempt - 1);
				const jitter = Math.floor(Math.random() * 300);
				const delay = backoff + jitter;
				await new Promise((res) => setTimeout(res, delay));
			}
		}

		client.logger.error(`[AI_SUMMARY] All ${retry} attempts failed summarizing to ${targetLang}: ${lastErr}`);
		throw new Error(`Summary failed after ${retry} attempts: ${lastErr?.message ?? String(lastErr)}`);
	};
}
