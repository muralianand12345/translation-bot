import discord from 'discord.js';

import { BotPresence } from './events';

export interface IConfig {
	bot: {
		owners: Array<string>;
		presence: {
			enabled: boolean;
			status: discord.PresenceStatusData;
			interval: number;
			activity: Array<BotPresence>;
		};
		command: {
			cooldown_message: string;
		};
		log: {
			command: string;
			server: string;
		};
	};
};
