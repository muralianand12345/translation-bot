"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
const ai_1 = require("../core/ai");
const response_1 = __importDefault(require("../core/response"));
const config_1 = require("../utils/config");
const ai_2 = require("../core/ai");
const locales_1 = require("../core/locales");
const localizationManager = locales_1.LocalizationManager.getInstance();
const localeDetector = new locales_1.LocaleDetector();
const config = config_1.ConfigManager.getInstance();
const summaryCommand = {
    cooldown: 3,
    data: new discord_js_1.default.ContextMenuCommandBuilder().setName('Summarize').setType(discord_js_1.default.ApplicationCommandType.Message).setNameLocalizations(localizationManager.getCommandLocalizations('commands.summary.name')),
    execute: async (interaction, client) => {
        await interaction.deferReply({ flags: discord_js_1.default.MessageFlags.Ephemeral });
        const t = await localeDetector.getTranslator(interaction);
        const responseHandler = new response_1.default(client);
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
            let textToSummarize = '';
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
                textToSummarize = textParts.join(' ');
            }
            if (!textToSummarize && message.content && message.content.trim().length > 0)
                textToSummarize = message.content;
            if (!textToSummarize || textToSummarize.trim().length === 0) {
                const hasAttachments = message.attachments && message.attachments.size > 0;
                const hasStickers = message.stickers && message.stickers.size > 0;
                if (hasAttachments || hasStickers) {
                    const embed = responseHandler.error(t('responses.summary.unsupported_content'));
                    return await interaction.editReply({ embeds: [embed] });
                }
                const embed = responseHandler.info(t('responses.summary.nothing_to_summarize'));
                return await interaction.editReply({ embeds: [embed] });
            }
            const ai = new ai_1.AI(config.getOpenAiApiKey(), config.getOpenAiBaseUrl());
            const summarizer = new ai_2.Summary(ai);
            const result = await summarizer.invoke(textToSummarize, userLang);
            const embed = new discord_js_1.default.EmbedBuilder()
                .setColor('#5865f2')
                .setTitle(t('responses.summary.title'))
                .setDescription(result.summary)
                .setFooter({ text: client.user?.username || 'Bot', iconURL: client.user?.displayAvatarURL() });
            return await interaction.editReply({ embeds: [embed] });
        }
        catch (error) {
            client.logger.error(`[SUMMARY_COMMAND] Error: ${error}`);
            const locale = await localeDetector.detectLocale(interaction);
            const embed = responseHandler.error(t('responses.errors.general_error'), locale, true);
            if (!interaction.replied) {
                await interaction.editReply({ embeds: [embed] });
            }
            else {
                await interaction.followUp({ embeds: [embed] });
            }
        }
    },
};
exports.default = summaryCommand;
