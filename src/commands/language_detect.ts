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

            // Extract text from embeds if present
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

            if (!textToDetect && message.content && message.content.trim().length > 0) {
                textToDetect = message.content;
            }

            if (!textToDetect || textToDetect.trim().length === 0) {
                const embed = responseHandler.info(t('responses.translate.nothing_to_translate'));
                return await interaction.editReply({ embeds: [embed] });
            }

            const detectedLanguage = await translator.language_detect(textToDetect);
            
            const allLanguages = [
                { code: 'en', name: 'English' },
                { code: 'es', name: 'Español' },
                { code: 'fr', name: 'Français' },
                { code: 'de', name: 'Deutsch' },
                { code: 'pt', name: 'Português' },
                { code: 'ja', name: '日本語' },
                { code: 'ko', name: '한국어' },
                { code: 'zh', name: '中文' },
                { code: 'ru', name: 'Русский' },
                { code: 'it', name: 'Italiano' },
                { code: 'nl', name: 'Nederlands' },
                { code: 'pl', name: 'Polski' },
                { code: 'tr', name: 'Türkçe' },
                { code: 'sv', name: 'Svenska' },
                { code: 'no', name: 'Norsk' },
                { code: 'da', name: 'Dansk' },
                { code: 'fi', name: 'Suomi' },
                { code: 'cs', name: 'Čeština' },
                { code: 'bg', name: 'Български' },
                { code: 'uk', name: 'Українська' },
                { code: 'hr', name: 'Hrvatski' },
                { code: 'ro', name: 'Română' },
                { code: 'lt', name: 'Lietuvių' },
                { code: 'el', name: 'Ελληνικά' },
                { code: 'hu', name: 'Magyar' },
                { code: 'th', name: 'ไทย' },
                { code: 'vi', name: 'Tiếng Việt' },
                { code: 'hi', name: 'हिन्दी' },
                { code: 'id', name: 'Bahasa Indonesia' },
            ];
            
            const languageInfo = allLanguages.find(lang => lang.code === detectedLanguage);
            let languageDisplay: string;
            if (languageInfo) {
                languageDisplay = `**${languageInfo.name} (${detectedLanguage.toUpperCase()})**`;
            } else {
                languageDisplay = `**${detectedLanguage.toUpperCase()}** (language's code)`;
            }

            const embed = new discord.EmbedBuilder()
                .setColor('#5865f2')
                .setDescription(`The detected language of the message is ${languageDisplay}.`)
                .setFooter({ text: interaction.client.user?.username || 'Bot' })
                .setTimestamp();

            return await interaction.editReply({ embeds: [embed] });
        } catch (error: any) {
            interaction.client.logger.error(`[LANGUAGE_DETECT_COMMAND] Error: ${error}`);
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
