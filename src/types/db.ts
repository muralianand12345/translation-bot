import mongoose from 'mongoose';

export interface IUserData extends mongoose.Document {
	userId: string;
	language?: string | null;
};
