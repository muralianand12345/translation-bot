"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AI = void 0;
const openai_1 = __importDefault(require("openai"));
class AI {
    constructor(apiKey, baseURL, options = {}) {
        this.invoke = async (messages, model = 'gpt-4o-mini', options = {}) => {
            return await this.openai.chat.completions.create({ model, messages, ...options });
        };
        this.openai = new openai_1.default({ apiKey: apiKey, baseURL: baseURL, ...options });
    }
}
exports.AI = AI;
;
