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
	data: new discord.ContextMenuCommandBuilder().setName('Language Detective').setType(discord.ApplicationCommandType.Message).setNameLocalizations(localizationManager.getCommandLocalizations('commands.translate.name')),
	execute: async (interaction: discord.MessageContextMenuCommandInteraction, client: discord.Client): Promise<discord.InteractionResponse<boolean> | discord.Message<boolean> | void> => {
		await interaction.deferReply({ flags: discord.MessageFlags.Ephemeral });

		const t = await localeDetector.getTranslator(interaction);
		const responseHandler = new DiscordResponse(client);

		try {
			const message = interaction.targetMessage;
			if (!message) {
				const embed = responseHandler.error(t('responses.errors.not_found'));
				return await interaction.editReply({ embeds: [embed] });
			}

			const ai = new AI(config.getOpenAiApiKey(), config.getOpenAiBaseUrl());
			const translator = new AITranslate(ai);
			let textToDetect = '';

			if (message.embeds && message.embeds.length > 0) {
				const originalEmbed = message.embeds[0];
				const textParts: string[] = [];
				if (originalEmbed.title) textParts.push(originalEmbed.title);
				if (originalEmbed.description) textParts.push(originalEmbed.description);
				if (originalEmbed.footer && originalEmbed.footer.text) textParts.push(originalEmbed.footer.text);
				if (originalEmbed.fields && originalEmbed.fields.length > 0) {
					for (const field of originalEmbed.fields) {
						if (field.name) textParts.push(field.name);
						if (field.value) textParts.push(field.value);
					}
				}
				textToDetect = textParts.join(' ');
			}

			if (!textToDetect && message.content && message.content.trim().length > 0) textToDetect = message.content;
			if (!textToDetect || textToDetect.trim().length === 0) {
				const embed = responseHandler.info(t('responses.translate.nothing_to_translate'));
				return await interaction.editReply({ embeds: [embed] });
			}

			const detectedLanguage = await translator.language_detect(textToDetect, interaction.locale || 'en');
			return await interaction.editReply({ embeds: [responseHandler.info(detectedLanguage)] });
		} catch (error: any) {
			interaction.client.logger.error(`[LANGUAGE_DETECT_COMMAND] Error: ${error}`);
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
