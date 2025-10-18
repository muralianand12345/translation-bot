"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocaleDetector = void 0;
const bot_1 = __importDefault(require("../../bot"));
const manager_1 = require("./manager");
const user_data_1 = __importDefault(require("../../events/database/schema/user_data"));
const languages_1 = require("../../types/languages");
class LocaleDetector {
    constructor() {
        this.initializeSupportedLanguages = (returnAll = false) => {
            if (returnAll)
                return [...languages_1.ALL_LANGUAGES];
            const supportedCodes = this.localizationManager.getSupportedLocales();
            const filteredLanguages = languages_1.ALL_LANGUAGES.filter((lang) => supportedCodes.includes(lang.code));
            return filteredLanguages;
        };
        this.validateLanguageCode = (language) => {
            if (!language || typeof language !== 'string')
                return false;
            return this.supportedLanguages.some((lang) => lang.code === language);
        };
        this.getUserLanguage = async (userId) => {
            try {
                if (!userId)
                    return null;
                const user = await user_data_1.default.findOne({ userId }).lean();
                const language = user?.language;
                if (language && !this.validateLanguageCode(language)) {
                    await this.setUserLanguage(userId, null);
                    return null;
                }
                return language || null;
            }
            catch (error) {
                bot_1.default.logger.error(`[LOCALE_DETECTOR] Error getting user language for ${userId}: ${error}`);
                return null;
            }
        };
        this.setUserLanguage = async (userId, language) => {
            try {
                if (!userId)
                    return false;
                if (language && !this.validateLanguageCode(language))
                    return false;
                await user_data_1.default.findOneAndUpdate({ userId }, { language }, { upsert: true, new: true });
                return true;
            }
            catch (error) {
                bot_1.default.logger.error(`[LOCALE_DETECTOR] Error setting user language for ${userId}: ${error}`);
                return false;
            }
        };
        this.detectLocale = async (interaction) => {
            try {
                if (!interaction || typeof interaction !== 'object' || !('user' in interaction) || !interaction.user || typeof interaction.user !== 'object' || !('id' in interaction.user) || typeof interaction.user.id !== 'string')
                    return 'en';
                const userLanguage = await this.getUserLanguage(interaction.user.id);
                if (userLanguage && this.localizationManager.isLocaleSupported(userLanguage))
                    return userLanguage;
                if ('locale' in interaction && typeof interaction.locale === 'string') {
                    const discordLocale = this.localizationManager.mapDiscordLocaleToOurs(interaction.locale);
                    if (this.localizationManager.isLocaleSupported(discordLocale))
                        return discordLocale;
                }
                return 'en';
            }
            catch (error) {
                bot_1.default.logger.error(`[LOCALE_DETECTOR] Error detecting locale: ${error}`);
                return 'en';
            }
        };
        this.getTranslator = async (interaction) => {
            const locale = await this.detectLocale(interaction);
            return (key, data) => {
                return this.localizationManager.translate(key, locale, data);
            };
        };
        this.isLanguageSupported = (language) => {
            return this.validateLanguageCode(language);
        };
        this.getSupportedLanguages = () => {
            return [...this.supportedLanguages];
        };
        this.getLanguageStats = () => {
            const allCodes = (0, languages_1.getAllLanguageCodes)();
            const supportedCodes = this.supportedLanguages.map((lang) => lang.code);
            const missingCodes = allCodes.filter((code) => !supportedCodes.includes(code));
            return { total: allCodes.length, supported: supportedCodes.length, missing: missingCodes.length, supportedCodes, missingCodes };
        };
        this.validateUserLanguage = async (userId) => {
            const currentLanguage = await this.getUserLanguage(userId);
            if (!currentLanguage)
                return { isValid: true, currentLanguage: null, needsUpdate: false };
            const isValid = this.validateLanguageCode(currentLanguage);
            return { isValid, currentLanguage, needsUpdate: !isValid };
        };
        this.getAvailableLanguagesForUser = (query = '') => {
            const lowerQuery = query.toLowerCase();
            return this.supportedLanguages.filter((lang) => lang.name.toLowerCase().includes(lowerQuery) || lang.code.toLowerCase().includes(lowerQuery));
        };
        this.getLocaleFromDiscordLocale = (discordLocale) => {
            const mappedLocale = this.localizationManager.mapDiscordLocaleToOurs(discordLocale);
            if (this.localizationManager.isLocaleSupported(mappedLocale))
                return mappedLocale;
            return 'en';
        };
        this.localizationManager = manager_1.LocalizationManager.getInstance();
        this.supportedLanguages = this.initializeSupportedLanguages(true);
    }
}
exports.LocaleDetector = LocaleDetector;
