import { Schema, model } from 'mongoose';

import { IUserData } from '../../../types';

const userDataSchema = new Schema<IUserData>({
	userId: { type: String, required: true },
	language: { type: String, required: false, default: null }
});

userDataSchema.index({ userId: 1 });

export default model('user-data', userDataSchema);