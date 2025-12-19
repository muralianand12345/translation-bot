"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.summaryResponseSchema = exports.translationResponseSchema = void 0;
const zod_1 = require("zod");
exports.translationResponseSchema = zod_1.z.object({ text: zod_1.z.string() });
exports.summaryResponseSchema = zod_1.z.object({ summary: zod_1.z.string() });
