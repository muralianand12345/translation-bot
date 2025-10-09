import discord from 'discord.js';

import { AI } from '../core/ai';
import { Command } from '../types';
import DiscordResponse from '../core/response';
import { ConfigManager } from '../utils/config';
import { Translate as AITranslate } from '../core/ai/translate';
import { LocalizationManager, LocaleDetector } from '../core/locales';

const localizationManager = LocalizationManager.getInstance();
const localeDetector = new LocaleDetector();

const config = ConfigManager.getInstance();

const translateCommand: Command = {
	cooldown: 3,
	data: new discord.ContextMenuCommandBuilder().setName('Translate').setType(discord.ApplicationCommandType.Message).setNameLocalizations(localizationManager.getCommandLocalizations('commands.translate.name')),
	execute: async (interaction: discord.MessageContextMenuCommandInteraction, client: discord.Client): Promise<discord.InteractionResponse<boolean> | discord.Message<boolean> | void> => {
		await interaction.deferReply({ flags: discord.MessageFlags.Ephemeral });

		const t = await localeDetector.getTranslator(interaction);
		const responseHandler = new DiscordResponse(client);

		try {
			const userLang = await localeDetector.getUserLanguage(interaction.user.id);
			if (!userLang) {
				const embed = responseHandler.info(t('responses.language.not_set'));
				return await interaction.editReply({ embeds: [embed], components: [responseHandler.getSupportButton('en')] });
			}

			const message = interaction.targetMessage;
			if (!message) {
				const embed = responseHandler.error(t('responses.errors.not_found'));
				return await interaction.editReply({ embeds: [embed] });
			}

			const ai = new AI(config.getOpenAiApiKey(), config.getOpenAiBaseUrl());
			const translator = new AITranslate(ai);

			if (message.embeds && message.embeds.length > 0) {
				const originalEmbed = message.embeds[0];
				const translatedEmbed = new discord.EmbedBuilder();

				if (originalEmbed.title) {
					const translated = await translator.invoke(originalEmbed.title, userLang);
					translatedEmbed.setTitle(translated.text);
				}
				if (originalEmbed.description) {
					const translated = await translator.invoke(originalEmbed.description, userLang);
					translatedEmbed.setDescription(translated.text);
				}
				if (originalEmbed.footer && originalEmbed.footer.text) {
					const translated = await translator.invoke(originalEmbed.footer.text, userLang);
					translatedEmbed.setFooter({ text: translated.text, iconURL: originalEmbed.footer.iconURL || undefined });
				}
				if (originalEmbed.color) translatedEmbed.setColor(originalEmbed.color);
				if (originalEmbed.url) translatedEmbed.setURL(originalEmbed.url);
				if (originalEmbed.thumbnail) translatedEmbed.setThumbnail(originalEmbed.thumbnail.url);
				if (originalEmbed.image) translatedEmbed.setImage(originalEmbed.image.url);
				if (originalEmbed.author) translatedEmbed.setAuthor({ name: originalEmbed.author.name || '', iconURL: originalEmbed.author.iconURL || undefined, url: originalEmbed.author.url || undefined });

				if (originalEmbed.fields && originalEmbed.fields.length > 0) {
					for (const f of originalEmbed.fields) {
						const nameT = await translator.invoke(f.name || '', userLang);
						const valueT = await translator.invoke(f.value || '', userLang);
						translatedEmbed.addFields({ name: nameT.text || '\u200b', value: valueT.text || '\u200b', inline: f.inline });
					}
				}

				return await interaction.editReply({ embeds: [translatedEmbed] });
			}

			if (message.content && message.content.trim().length > 0) {
				const translated = await translator.invoke(message.content, userLang);
				const embed = new discord.EmbedBuilder()
					.setColor('#5865f2')
					.setDescription(translated.text)
					.setFooter({ text: interaction.client.user?.username || 'Bot' });
				return await interaction.editReply({ embeds: [embed] });
			}

			const embed = responseHandler.info(t('responses.translate.nothing_to_translate'));
			return await interaction.editReply({ embeds: [embed] });
		} catch (error: any) {
			interaction.client.logger.error(`[TRANSLATE_COMMAND] Error: ${error}`);
			const responseHandler = new DiscordResponse(interaction.client);
			const embed = responseHandler.error(t('responses.errors.general_error'));
			if (!interaction.replied) {
				await interaction.editReply({ embeds: [embed] });
			} else {
				await interaction.followUp({ embeds: [embed] });
			}
		}
	},
};

export default translateCommand;
