import OpenAI from 'openai';

export class AI {
	private openai: OpenAI;

	constructor(apiKey: string, baseURL?: string, options: Record<string, any> = {}) {
		this.openai = new OpenAI({ apiKey: apiKey, baseURL: baseURL, ...options });
	}

	invoke = async (messages: OpenAI.ChatCompletionMessageParam[], model: string = 'gpt-4o-mini', options: Record<string, any> = {}): Promise<any> => {
		return await this.openai.chat.completions.create({ model, messages, ...options });
	};
};
