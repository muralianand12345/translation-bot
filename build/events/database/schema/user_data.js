"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const userDataSchema = new mongoose_1.Schema({
    userId: { type: String, required: true },
    language: { type: String, required: false, default: null }
});
userDataSchema.index({ userId: 1 });
exports.default = (0, mongoose_1.model)('user-data', userDataSchema);
