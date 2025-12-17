import { Schema, model } from 'mongoose';

import { ITranslationCache } from '../../../types';

const translationCacheSchema = new Schema<ITranslationCache>({
	cacheKey: { type: String, required: true, unique: true },
	inputText: { type: String, required: true },
	targetLang: { type: String, required: true },
	translatedText: { type: String, required: true },
	createdAt: { type: Date, default: Date.now, expires: 604800 },
});

export default model('translation-cache', translationCacheSchema);
