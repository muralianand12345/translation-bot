import discord from 'discord.js';

export interface ILogger {
	success(message: string | Error): void;
	log(message: string | Error): void;
	error(message: string | Error): void;
	warn(message: string | Error): void;
	info(message: string | Error): void;
	debug(message: string | Error): void;
}

export interface ICommandLoggerOptions {
	client: discord.Client;
	commandName?: string | null;
	guild: discord.Guild | null;
	user: discord.User | null;
	channel: discord.Channel | null;
	locale?: string | null;
	interaction?: discord.Interaction | null;
}

export interface ICommandLogger {
	log(options: ICommandLoggerOptions): Promise<void>;
}
