// import { z } from 'zod';
import { AI } from './index';

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

	invoke = async (input: string, targetLang: string): Promise<TranslationResponse> => {
		const messages = [
			{ role: 'system' as const, content: `You are a helpful translation assistant. Translate the user's text to ${targetLang} and respond only with a JSON object matching the schema: "{ "text": "...translated text..." }". Do not include any additional explanation..` },
			{ role: 'user' as const, content: input },
		];

		try {
			const response = await this.ai.invoke(messages, client.config.ai.translate_model, { response_format: { type: 'json_object' } }); //response_format: { type: 'json_schema', json_schema: { name: 'translation_response', schema: z.toJSONSchema(translationResponseSchema) } } });
			const raw = JSON.parse(response.choices[0].message.content || '{}');
			return translationResponseSchema.parse(raw);
		} catch (err: any) {
			throw new Error(`Translation failed: ${err?.message ?? String(err)}`);
		}
	};
}
