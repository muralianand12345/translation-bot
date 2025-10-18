import fs from 'fs';
import path from 'path';
import discord from 'discord.js';

import { ICommandLoggerOptions, ICommandLogger } from '../types';

/**
 * Class responsible for logging Discord bot command executions.
 * Handles both file-based logging and Discord channel logging with embeds.
 */
class CommandLogger implements ICommandLogger {
	private readonly logFilePath: string;

	constructor(logsPath: string = '../../logs') {
		this.logFilePath = path.join(__dirname, logsPath, 'bot-user-log.log');
		this.ensureLogDirectory();
	}

	private ensureLogDirectory(): void {
		const directory = path.dirname(this.logFilePath);
		if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
	}

	private getCurrentTimestamp(): string {
		const now: Date = new Date();
		return `[${now.toISOString()}]`;
	}

	private writeToLogFile(logMessage: string): void {
		const logWithoutColor: string = logMessage.replace(/\x1b\[[0-9;]*m/g, '');
		fs.appendFileSync(this.logFilePath, logWithoutColor + '\n', 'utf8');
	}

	private async createLogEmbed(options: ICommandLoggerOptions): Promise<discord.EmbedBuilder> {
		const { client, user, commandName, guild, channel, locale } = options;

		const embed = new discord.EmbedBuilder().setColor('Green').setAuthor({ name: 'Command Log' }).setTimestamp();
		embed.addFields({ name: 'User', value: user ? `${user.tag} (<@${user.id}>)` : 'N/A' });

		const interactionAny = options.interaction as any;
		const commandLabel = commandName || (interactionAny && (interactionAny.commandName || interactionAny.command?.name || interactionAny.name)) || 'N/A';
		embed.addFields({ name: 'Command', value: `${commandLabel}` });

		if (!guild) {
			embed.addFields({ name: 'Guild', value: 'DM' });
		} else {
			let botGuildNickname = 'N/A';
			try {
				const cached = client.guilds.cache.get(guild.id);
				if (cached) {
					const member = await cached.members.fetch(client.user!.id).catch(() => null);
					if (member) botGuildNickname = member.displayName || 'N/A';
				}
			} catch (e) {
				botGuildNickname = 'N/A';
			}

			embed.addFields({ name: 'Guild', value: `${guild.name || 'Unknown'} (${guild.id || 'N/A'})` }, { name: 'Bot Nickname', value: `${botGuildNickname}` });
		}

		if (!channel) {
			embed.addFields({ name: 'Channel', value: 'DM' });
		} else {
			let channelDesc = 'N/A';
			try {
				if ((channel as any).name) {
					channelDesc = `${(channel as any).name} (<#${(channel as any).id}>)`;
				} else if ((channel as any).id) {
					channelDesc = `<#${(channel as any).id}>`;
				} else {
					channelDesc = `${(channel as any).type || 'Unknown'}`;
				}
			} catch (e) {
				channelDesc = 'N/A';
			}
			embed.addFields({ name: 'Channel', value: channelDesc });
		}

		if (locale) embed.setFooter({ text: `Locale: ${locale}` });

		return embed;
	}

	private createLogMessage(options: ICommandLoggerOptions): string {
		const { user, commandName, guild, channel, locale } = options;
		const channelName = (channel as any)?.name || (channel as any)?.id || 'DM';
		return `${this.getCurrentTimestamp()} '[COMMAND]' ${user?.tag} (${user?.id}) used command ${commandName || (options.interaction ? ((options.interaction as any).commandName || (options.interaction as any).name) : 'N/A')} in ${guild ? guild.name : 'DM'} [#${channelName}] ${locale ? `[${locale}]` : ''}`;
	}

	public async log(options: ICommandLoggerOptions): Promise<void> {
		const { client, user, commandName } = options;

		if (!client?.config?.bot?.log?.command) return client.logger.error('[COMMAND_LOG] Missing log channel configuration');
		if (!user) client.logger.error(`[COMMAND_LOG] User is undefined! ${commandName}`);

		const logChannel = client.channels.cache.get(client.config.bot.log.command.toString()) as discord.TextChannel | undefined;
		if (!logChannel || !(logChannel instanceof discord.TextChannel)) return client.logger.error(`[COMMAND_LOG] Invalid log channel: ${client.config.bot.log.command}`);

		const logMessage = this.createLogMessage(options);
		this.writeToLogFile(logMessage);
		const embed = await this.createLogEmbed(options);
		logChannel.send({ embeds: [embed] }).catch((error) => client.logger.error(`[COMMAND_LOG] Send error: ${error}`));
	}
}

export default CommandLogger;
