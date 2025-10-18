import discord from 'discord.js';

import { IConfig } from './config';
import { ILogger } from './logger';
import { Command } from './events';
import CommandLogger from '../utils/command_logger';
import { LocalizationManager } from '../core/locales';

declare global {
	namespace NodeJS {
		interface ProcessEnv {
			DEBUG_MODE: boolean | string;
			TOKEN: string;
			MONGO_URI: string;
			FEEDBACK_WEBHOOK: string;
		}
	}
}

declare module 'discord.js' {
	export interface Client {
		commands: discord.Collection<string, Command>;
		cooldowns: discord.Collection<string, number>;
		logger: ILogger;
		cmdLogger: CommandLogger;
		config: IConfig;
		localizationManager?: LocalizationManager;
	}
}

export * from './db';
export * from './logger';
export * from './events';
export * from './config';
export * from './locales';