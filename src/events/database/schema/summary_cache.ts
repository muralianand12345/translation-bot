import { Schema, model } from 'mongoose';

import { ISummaryCache } from '../../../types';

const summaryCacheSchema = new Schema<ISummaryCache>({
	cacheKey: { type: String, required: true, unique: true },
	inputText: { type: String, required: true },
	targetLang: { type: String, required: true },
	summaryText: { type: String, required: true },
	createdAt: { type: Date, default: Date.now, expires: 604800 },
});

export default model('summary-cache', summaryCacheSchema);
