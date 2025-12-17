import mongoose from 'mongoose';

export interface IUserData extends mongoose.Document {
	userId: string;
	language?: string | null;
}

export interface ITranslationCache extends mongoose.Document {
	cacheKey: string;
	inputText: string;
	targetLang: string;
	translatedText: string;
	createdAt: Date;
}
