"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Translate = void 0;
const zod_1 = require("zod");
const schema_1 = require("./schema");
class Translate {
    constructor(ai) {
        this.ai = ai;
        this.invoke = async (input, sourceLang, targetLang) => {
            const messages = [
                { role: 'system', content: `You are a helpful translation assistant. Translate the user's text from ${sourceLang} to ${targetLang} and respond only with a JSON object matching the schema: { "text": "...translated text..." }. Do not include any additional explanation.` },
                { role: 'user', content: input },
            ];
            try {
                const response = await this.ai.invoke(messages, 'gpt-4o-mini', { response_format: { type: 'json_schema', json_schema: { name: 'translation_response', schema: zod_1.z.toJSONSchema(schema_1.translationResponseSchema) } } });
                const raw = JSON.parse(response.choices[0].message.content || '{}');
                return schema_1.translationResponseSchema.parse(raw);
            }
            catch (err) {
                throw new Error(`Translation failed: ${err?.message ?? String(err)}`);
            }
        };
    }
}
exports.Translate = Translate;
