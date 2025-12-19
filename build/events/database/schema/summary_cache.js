"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const summaryCacheSchema = new mongoose_1.Schema({
    cacheKey: { type: String, required: true, unique: true },
    inputText: { type: String, required: true },
    targetLang: { type: String, required: true },
    summaryText: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 604800 },
});
exports.default = (0, mongoose_1.model)('summary-cache', summaryCacheSchema);
