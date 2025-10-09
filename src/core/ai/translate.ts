// import { z } from 'zod';
import { AI } from './index';
import * as langdetect from 'langdetect';

import client from '../../bot';
import user_data from '../../events/database/schema/user_data';
import { translationResponseSchema, TranslationResponse } from './schema';

export class Translate {
	constructor(private ai: AI) {}

	private validateUserData = async (userId: string): Promise<boolean> => {
		try {
			if (!userId) return false;
			const user = await user_data.findOne({ userId }).lean();
			return !!user;
		} catch (error) {
			client.logger.error(`[AI_TRANSLATE] Error validating user data for ${userId}: ${error}`);
			return false;
		}
	};

	setup = async (userId: string, targetLang: string): Promise<void> => {
		try {
			if (!userId) throw new Error('userId is required');
			const exists = await this.validateUserData(userId);
			await user_data.findOneAndUpdate({ userId }, { language: targetLang }, { upsert: true, new: true });
			if (exists) {
				client.logger.info(`[AI_TRANSLATE] Updated language for existing user ${userId} -> ${targetLang}`);
			} else {
				client.logger.info(`[AI_TRANSLATE] Set language for new user ${userId} -> ${targetLang}`);
			}
		} catch (error: any) {
			client.logger.error(`[AI_TRANSLATE] Error setting up user ${userId} language to ${targetLang}: ${error}`);
			throw new Error(error?.message ?? String(error));
		}
	};

	getlang = async (userId: string): Promise<string | null> => {
		try {
			if (!userId) throw new Error('userId is required');
			const user = await user_data.findOne({ userId }).lean();
			return user?.language || null;
		} catch (error: any) {
			client.logger.error(`[AI_TRANSLATE] Error retrieving language for user ${userId}: ${error}`);
			throw new Error(error?.message ?? String(error));
		}
	};
	
	language_detect_ai = async (input: string): Promise<string> => {
		const messages = [
			{ role: 'system' as const, content: `You are a helpful assistant that detects the language of the user's text. Respond only with the ISO 639-1 language code (e.g., "en" for English, "ja" for Japanese). Do not include any additional explanation.` },
			{ role: 'user' as const, content: input },
		];

		try {
			const response = await this.ai.invoke(messages, client.config.ai.translate_model);
			const content = response?.choices?.[0]?.message?.content;
			if (!content || typeof content !== 'string') throw new Error('Empty response content');

			const langCode = content.trim().toLowerCase();
			if (!/^[a-z]{2}$/.test(langCode)) {
				throw new Error(`Invalid language code received: "${langCode}"`);
			}

			return langCode;
		} catch (err: any) {
			client.logger.error(`[AI_TRANSLATE] Language detection failed: ${err?.message ?? String(err)}`);
			throw new Error(`Language detection failed: ${err?.message ?? String(err)}`);
		}
	};
	
	language_detect = async (text: string): Promise<string> => {
		try {
			const detectedResults = langdetect.detect(text);
			const detected = Array.isArray(detectedResults) && detectedResults.length > 0 ? detectedResults[0] : null;
			const detected_lang = detected ? detected.lang : 'unknown';
			if (detected_lang === 'unknown' || !detected_lang || detected_lang.length !== 2) {
				client.logger.warn(`[AI] Language detection uncertain, falling back to AI`);
				try {
					const aiLang = await this.language_detect_ai(text);
					client.logger.debug(`[AI] Detected language via AI: ${aiLang}`);
					return aiLang;
				} catch (error) {
					client.logger.error(`[AI] Error detecting language via AI: ${error}`);
					return 'unknown';
				}
			}
			client.logger.debug(`[NON-AI] Detected language: ${detected_lang} (confidence: ${detected?.prob})`);
			return detected_lang;
		} catch (error) {
			client.logger.error(`[NON-AI] Error detecting language: ${error}`);
			return 'unknown';
		}
	};

	invoke = async (input: string, targetLang: string, retry: number = 5): Promise<TranslationResponse> => {
		const messages = [
			{ role: 'system' as const, content: `You are a helpful translation assistant. Translate the user's text to ${targetLang} and respond only with a JSON object matching the schema: "{ \"text\": \"...translated text...\" }". Do not include any additional explanation.` },
			{ role: 'user' as const, content: input },
		];

		let attempt = 0;
		let lastErr: any = null;

		while (attempt < retry) {
			attempt++;
			try {
				const response = await this.ai.invoke(messages, client.config.ai.translate_model, { response_format: { type: 'json_object' } }); //response_format: { type: 'json_schema', json_schema: { name: 'translation_response', schema: z.toJSONSchema(translationResponseSchema) } } });
				const content = response?.choices?.[0]?.message?.content;
				if (!content || typeof content !== 'string') throw new Error('Empty response content');

				let parsed: any = null;
				try {
					parsed = JSON.parse(content);
				} catch (e) {
					const match = content.match(/\{[\s\S]*\}/);
					if (match) {
						try {
							parsed = JSON.parse(match[0]);
						} catch (e2) {
							throw new Error('Failed to parse JSON from model response');
						}
					} else {
						throw new Error('No JSON object found in model response');
					}
				}

				const result = translationResponseSchema.parse(parsed);
				return result;
			} catch (err: any) {
				lastErr = err;
				client.logger.warn(`[AI_TRANSLATE] Attempt ${attempt} failed: ${err?.message ?? String(err)}`);
				if (attempt >= retry) break;
				const baseDelay = 500;
				const backoff = baseDelay * Math.pow(2, attempt - 1);
				const jitter = Math.floor(Math.random() * 300);
				const delay = backoff + jitter;
				await new Promise((res) => setTimeout(res, delay));
			}
		}

		client.logger.error(`[AI_TRANSLATE] All ${retry} attempts failed translating to ${targetLang}: ${lastErr}`);
		throw new Error(`Translation failed after ${retry} attempts: ${lastErr?.message ?? String(lastErr)}`);
	};
}
