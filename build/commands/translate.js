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
    data: new discord_js_1.default.ContextMenuCommandBuilder().setName('Translate').setType(discord_js_1.default.ApplicationCommandType.Message).setNameLocalizations(localizationManager.getCommandLocalizations('commands.translate.name')),
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
            const ai = new ai_1.AI(config.getOpenAiApiKey(), config.getOpenAiBaseUrl());
            const translator = new translate_1.Translate(ai);
            if (message.embeds && message.embeds.length > 0) {
                const originalEmbed = message.embeds[0];
                const translatedEmbed = new discord_js_1.default.EmbedBuilder();
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
                if (originalEmbed.color)
                    translatedEmbed.setColor(originalEmbed.color);
                if (originalEmbed.url)
                    translatedEmbed.setURL(originalEmbed.url);
                if (originalEmbed.thumbnail)
                    translatedEmbed.setThumbnail(originalEmbed.thumbnail.url);
                if (originalEmbed.image)
                    translatedEmbed.setImage(originalEmbed.image.url);
                if (originalEmbed.author)
                    translatedEmbed.setAuthor({ name: originalEmbed.author.name || '', iconURL: originalEmbed.author.iconURL || undefined, url: originalEmbed.author.url || undefined });
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
                const embed = new discord_js_1.default.EmbedBuilder()
                    .setColor('#5865f2')
                    .setDescription(translated.text)
                    .setFooter({ text: interaction.client.user?.username || 'Bot' });
                return await interaction.editReply({ embeds: [embed] });
            }
            const embed = responseHandler.info(t('responses.translate.nothing_to_translate'));
            return await interaction.editReply({ embeds: [embed] });
        }
        catch (error) {
            interaction.client.logger.error(`[TRANSLATE_COMMAND] Error: ${error}`);
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
