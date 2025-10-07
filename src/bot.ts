import discord from 'discord.js';

import { Command } from './types';
import Logger from './utils/logger';
import { loadConfig } from './utils/config';
import CommandLogger from './utils/command_logger';
import { LocalizationManager } from './core/locales';

const createClient = (): discord.Client => {
	const client = new discord.Client({ intents: [discord.GatewayIntentBits.Guilds, discord.GatewayIntentBits.GuildMessages] });

	client.logger = new Logger();
	client.cmdLogger = new CommandLogger();
	client.commands = new discord.Collection<string, Command>();
	client.cooldowns = new discord.Collection<string, number>();
	client.config = loadConfig(client);
	client.localizationManager = LocalizationManager.getInstance();

	return client;
};

const client = createClient();

export default client;