import { z } from 'zod';
import { AI } from './index';
import { translationResponseSchema, TranslationResponse } from './schema';

export class Translate {
	constructor(private ai: AI) {}

	invoke = async (input: string, sourceLang: string, targetLang: string): Promise<TranslationResponse> => {
		const messages = [
			{ role: 'system' as const, content: `You are a helpful translation assistant. Translate the user's text from ${sourceLang} to ${targetLang} and respond only with a JSON object matching the schema: { "text": "...translated text..." }. Do not include any additional explanation.` },
			{ role: 'user' as const, content: input },
		];

		try {
			const response = await this.ai.invoke(messages, 'gpt-4o-mini', { response_format: { type: 'json_schema', json_schema: { name: 'translation_response', schema: z.toJSONSchema(translationResponseSchema) } } });
			const raw = JSON.parse(response.choices[0].message.content || '{}');
			return translationResponseSchema.parse(raw);
		} catch (err: any) {
			throw new Error(`Translation failed: ${err?.message ?? String(err)}`);
		}
	};
}
