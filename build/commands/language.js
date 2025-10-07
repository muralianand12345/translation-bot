"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
const response_1 = __importDefault(require("../core/response"));
const locales_1 = require("../core/locales");
const localizationManager = locales_1.LocalizationManager.getInstance();
const localeDetector = new locales_1.LocaleDetector();
const langCommand = {
    cooldown: 3600,
    data: new discord_js_1.default.SlashCommandBuilder()
        .setName('language')
        .setDescription('Set language preferences for the bot')
        .setNameLocalizations(localizationManager.getCommandLocalizations('commands.language.name'))
        .setDescriptionLocalizations(localizationManager.getCommandLocalizations('commands.language.description'))
        .addStringOption((option) => option
        .setName('scope')
        .setDescription('Set language for user or server')
        .setNameLocalizations(localizationManager.getCommandLocalizations('commands.language.options.scope.name'))
        .setDescriptionLocalizations(localizationManager.getCommandLocalizations('commands.language.options.scope.description'))
        .setRequired(true)
        .addChoices({ name: 'User', value: 'user', name_localizations: localizationManager.getCommandLocalizations('commands.language.options.scope.choices.user') }, { name: 'Reset', value: 'reset', name_localizations: localizationManager.getCommandLocalizations('commands.language.options.scope.choices.reset') }))
        .addStringOption((option) => option.setName('language').setDescription('Choose your preferred language').setNameLocalizations(localizationManager.getCommandLocalizations('commands.language.options.language.name')).setDescriptionLocalizations(localizationManager.getCommandLocalizations('commands.language.options.language.description')).setRequired(false).setAutocomplete(true)),
    autocomplete: async (interaction, _client) => {
        const focused = interaction.options.getFocused(true);
        if (focused.name === 'language') {
            const supportedLanguages = localeDetector.getSupportedLanguages();
            const query = focused.value.toLowerCase();
            const filtered = supportedLanguages
                .filter((lang) => lang.name.toLowerCase().includes(query) || lang.code.toLowerCase().includes(query))
                .slice(0, 25)
                .map((lang) => ({ name: `${lang.name} (${lang.code})`, value: lang.code }));
            await interaction.respond(filtered);
        }
    },
    execute: async (interaction, client) => {
        const t = await localeDetector.getTranslator(interaction);
        const responseHandler = new response_1.default(client);
        const currentLocale = await localeDetector.detectLocale(interaction);
        const scope = interaction.options.getString('scope', true);
        const language = interaction.options.getString('language');
        try {
            if (scope === 'reset') {
                await localeDetector.setUserLanguage(interaction.user.id, null);
                const embed = responseHandler.success(t('responses.language.reset'));
                return await interaction.reply({ embeds: [embed], flags: discord_js_1.default.MessageFlags.Ephemeral });
            }
            if (!language) {
                const embed = responseHandler.error('Please provide a language when not using reset option.', currentLocale);
                return await interaction.reply({ embeds: [embed], flags: discord_js_1.default.MessageFlags.Ephemeral });
            }
            if (!localeDetector.isLanguageSupported(language)) {
                const supportedLanguages = localeDetector.getSupportedLanguages();
                const languageList = supportedLanguages.map((lang) => `${lang.name} (${lang.code})`).join(', ');
                const embed = responseHandler.error(t('responses.language.unsupported', { language, languages: languageList }), currentLocale);
                return await interaction.reply({ embeds: [embed], flags: discord_js_1.default.MessageFlags.Ephemeral });
            }
            if (scope === 'user') {
                const currentUserLang = await localeDetector.getUserLanguage(interaction.user.id);
                if (currentUserLang === language) {
                    const languageName = localeDetector.getSupportedLanguages().find((l) => l.code === language)?.name || language;
                    const embed = responseHandler.info(t('responses.language.same_language', { language: languageName }));
                    return await interaction.reply({ embeds: [embed], flags: discord_js_1.default.MessageFlags.Ephemeral });
                }
                const success = await localeDetector.setUserLanguage(interaction.user.id, language);
                if (success) {
                    const languageName = localeDetector.getSupportedLanguages().find((l) => l.code === language)?.name || language;
                    const embed = responseHandler.success(localizationManager.translate('responses.language.user_set', language, { language: languageName }));
                    await interaction.reply({ embeds: [embed], flags: discord_js_1.default.MessageFlags.Ephemeral });
                }
                else {
                    const embed = responseHandler.error('Failed to set user language preference.', currentLocale);
                    await interaction.reply({ embeds: [embed], flags: discord_js_1.default.MessageFlags.Ephemeral });
                }
            }
        }
        catch (error) {
            client.logger.error(`[LANGUAGE_COMMAND] Error: ${error}`);
            const embed = responseHandler.error(t('responses.errors.general_error'), currentLocale, true);
            if (!interaction.replied) {
                await interaction.reply({ embeds: [embed], flags: discord_js_1.default.MessageFlags.Ephemeral });
            }
            else {
                await interaction.followUp({ embeds: [embed], flags: discord_js_1.default.MessageFlags.Ephemeral });
            }
        }
    },
};
exports.default = langCommand;
