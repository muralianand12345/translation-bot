import discord from 'discord.js';
;
import { LocalizationManager } from './locales/manager';

export default class DiscordResponse {
    private readonly client: discord.Client;
	private localizationManager: LocalizationManager;

	constructor(client: discord.Client) {
		this.client = client;
		this.localizationManager = LocalizationManager.getInstance();
	}

    public success = (message: string): discord.EmbedBuilder => {
		return new discord.EmbedBuilder()
			.setColor('#43b581')
			.setDescription(`✓ ${message}`)
			.setFooter({ text: this.client.user?.username || 'Music Bot', iconURL: this.client.user?.displayAvatarURL() });
	};

    public error = (message: string, locale: string = 'en', contact_dev: boolean = false): discord.EmbedBuilder => {
		return new discord.EmbedBuilder()
			.setColor('#f04747')
			.setDescription(`❌ ${message}`)
			.setFooter({ text: contact_dev ? this.localizationManager.translate('responses.errors.contact_dev', locale) : this.client.user?.username || 'Music Bot', iconURL: this.client.user?.displayAvatarURL()});
	};

    public info = (message: string): discord.EmbedBuilder => {
		return new discord.EmbedBuilder()
			.setColor('#5865f2')
			.setDescription(`ℹ️ ${message}`)
			.setFooter({ text: this.client.user?.username || 'Music Bot', iconURL: this.client.user?.displayAvatarURL() });
	};

    public warning = (message: string): discord.EmbedBuilder => {
		return new discord.EmbedBuilder()
			.setColor('#faa61a')
			.setDescription(`⚠️ ${message}`)
			.setFooter({ text: this.client.user?.username || 'Music Bot', iconURL: this.client.user?.displayAvatarURL() });
	};

    public getSupportButton = (locale: string = 'en'): discord.ActionRowBuilder<discord.ButtonBuilder> => {
		return new discord.ActionRowBuilder<discord.ButtonBuilder>().addComponents(new discord.ButtonBuilder().setLabel(this.localizationManager.translate('responses.buttons.support_server', locale)).setStyle(discord.ButtonStyle.Link).setURL('https://discord.gg/XzE9hSbsNb').setEmoji('🔧'));
	};
}