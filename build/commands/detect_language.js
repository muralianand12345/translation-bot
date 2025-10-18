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
    data: new discord_js_1.default.ContextMenuCommandBuilder().setName('Detect Language').setType(discord_js_1.default.ApplicationCommandType.Message).setNameLocalizations(localizationManager.getCommandLocalizations('commands.detect_language.name')),
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
            if (!textToDetect && message.content && message.content.trim().length > 0)
                textToDetect = message.content;
            if (!textToDetect || textToDetect.trim().length === 0) {
                const embed = responseHandler.info(t('responses.detect_language.nothing_to_detect'));
                return await interaction.editReply({ embeds: [embed] });
            }
            const detectedLanguage = await translator.language_detect(textToDetect, interaction.locale || 'en');
            return await interaction.editReply({ embeds: [responseHandler.info(detectedLanguage)] });
        }
        catch (error) {
            interaction.client.logger.error(`[LANGUAGE_DETECT_COMMAND] Error: ${error}`);
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
