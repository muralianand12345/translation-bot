"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translationResponseSchema = void 0;
const zod_1 = require("zod");
exports.translationResponseSchema = zod_1.z.object({ text: zod_1.z.string() });
