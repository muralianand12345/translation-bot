"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
const ai_1 = require("../core/ai");
const response_1 = __importDefault(require("../core/response"));
const config_1 = require("../utils/config");
const translate_1 = require("../core/ai/translate");
const locales_1 = require("../core/locales");
const localizationManager = locales_1.LocalizationManager.getInstance();
const localeDetector = new locales_1.LocaleDetector();
const config = config_1.ConfigManager.getInstance();
const translateCommand = {
    cooldown: 3,
    data: new discord_js_1.default.ContextMenuCommandBuilder().setName('Language Detective').setType(discord_js_1.default.ApplicationCommandType.Message).setNameLocalizations(localizationManager.getCommandLocalizations('commands.translate.name')),
    execute: async (interaction, client) => {
        await interaction.deferReply({ flags: discord_js_1.default.MessageFlags.Ephemeral });
        const t = await localeDetector.getTranslator(interaction);
        const responseHandler = new response_1.default(client);
        try {
            const message = interaction.targetMessage;
            if (!message) {
                const embed = responseHandler.error(t('responses.errors.not_found'));
                return await interaction.editReply({ embeds: [embed] });
            }
            const ai = new ai_1.AI(config.getOpenAiApiKey(), config.getOpenAiBaseUrl());
            const translator = new translate_1.Translate(ai);
            let textToDetect = '';
            // Extract text from embeds if present
            if (message.embeds && message.embeds.length > 0) {
                const originalEmbed = message.embeds[0];
                const textParts = [];
                if (originalEmbed.title)
                    textParts.push(originalEmbed.title);
                if (originalEmbed.description)
                    textParts.push(originalEmbed.description);
                if (originalEmbed.footer && originalEmbed.footer.text)
                    textParts.push(originalEmbed.footer.text);
                if (originalEmbed.fields && originalEmbed.fields.length > 0) {
                    for (const field of originalEmbed.fields) {
                        if (field.name)
                            textParts.push(field.name);
                        if (field.value)
                            textParts.push(field.value);
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
            let languageDisplay;
            if (languageInfo) {
                languageDisplay = `**${languageInfo.name} (${detectedLanguage.toUpperCase()})**`;
            }
            else {
                languageDisplay = `**${detectedLanguage.toUpperCase()}** (language's code)`;
            }
            const embed = new discord_js_1.default.EmbedBuilder()
                .setColor('#5865f2')
                .setDescription(`The detected language of the message is ${languageDisplay}.`)
                .setFooter({ text: interaction.client.user?.username || 'Bot' })
                .setTimestamp();
            return await interaction.editReply({ embeds: [embed] });
        }
        catch (error) {
            interaction.client.logger.error(`[LANGUAGE_DETECT_COMMAND] Error: ${error}`);
            const responseHandler = new response_1.default(interaction.client);
            const embed = responseHandler.error(t('responses.errors.general_error'));
            if (!interaction.replied) {
                await interaction.editReply({ embeds: [embed] });
            }
            else {
                await interaction.followUp({ embeds: [embed] });
            }
        }
    },
};
exports.default = translateCommand;
