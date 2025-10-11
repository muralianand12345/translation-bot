"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapDiscordLocaleToLanguage = exports.mapToDiscordLocale = exports.getLanguageByCode = exports.getAllLanguageCodes = exports.DISCORD_LOCALE_TO_LANGUAGE = exports.LANGUAGE_TO_DISCORD_LOCALE = exports.ALL_LANGUAGES = void 0;
const discord_js_1 = __importDefault(require("discord.js"));
/**
 * Complete list of all supported languages with their codes and native names
 */
exports.ALL_LANGUAGES = [
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
/**
 * Mapping from our language codes to Discord locales
 */
exports.LANGUAGE_TO_DISCORD_LOCALE = {
    en: discord_js_1.default.Locale.EnglishUS,
    es: discord_js_1.default.Locale.SpanishES,
    fr: discord_js_1.default.Locale.French,
    de: discord_js_1.default.Locale.German,
    pt: discord_js_1.default.Locale.PortugueseBR,
    ja: discord_js_1.default.Locale.Japanese,
    ko: discord_js_1.default.Locale.Korean,
    zh: discord_js_1.default.Locale.ChineseCN,
    ru: discord_js_1.default.Locale.Russian,
    it: discord_js_1.default.Locale.Italian,
    nl: discord_js_1.default.Locale.Dutch,
    pl: discord_js_1.default.Locale.Polish,
    tr: discord_js_1.default.Locale.Turkish,
    sv: discord_js_1.default.Locale.Swedish,
    no: discord_js_1.default.Locale.Norwegian,
    da: discord_js_1.default.Locale.Danish,
    fi: discord_js_1.default.Locale.Finnish,
    cs: discord_js_1.default.Locale.Czech,
    bg: discord_js_1.default.Locale.Bulgarian,
    uk: discord_js_1.default.Locale.Ukrainian,
    hr: discord_js_1.default.Locale.Croatian,
    ro: discord_js_1.default.Locale.Romanian,
    lt: discord_js_1.default.Locale.Lithuanian,
    el: discord_js_1.default.Locale.Greek,
    hu: discord_js_1.default.Locale.Hungarian,
    th: discord_js_1.default.Locale.Thai,
    vi: discord_js_1.default.Locale.Vietnamese,
    hi: discord_js_1.default.Locale.Hindi,
    id: discord_js_1.default.Locale.Indonesian,
};
/**
 * Mapping from Discord locales to our language codes
 */
exports.DISCORD_LOCALE_TO_LANGUAGE = {
    [discord_js_1.default.Locale.EnglishUS]: 'en',
    [discord_js_1.default.Locale.EnglishGB]: 'en',
    [discord_js_1.default.Locale.SpanishES]: 'es',
    [discord_js_1.default.Locale.French]: 'fr',
    [discord_js_1.default.Locale.German]: 'de',
    [discord_js_1.default.Locale.PortugueseBR]: 'pt',
    [discord_js_1.default.Locale.Japanese]: 'ja',
    [discord_js_1.default.Locale.Korean]: 'ko',
    [discord_js_1.default.Locale.ChineseCN]: 'zh',
    [discord_js_1.default.Locale.Russian]: 'ru',
    [discord_js_1.default.Locale.Italian]: 'it',
    [discord_js_1.default.Locale.Dutch]: 'nl',
    [discord_js_1.default.Locale.Polish]: 'pl',
    [discord_js_1.default.Locale.Turkish]: 'tr',
    [discord_js_1.default.Locale.Swedish]: 'sv',
    [discord_js_1.default.Locale.Norwegian]: 'no',
    [discord_js_1.default.Locale.Danish]: 'da',
    [discord_js_1.default.Locale.Finnish]: 'fi',
    [discord_js_1.default.Locale.Czech]: 'cs',
    [discord_js_1.default.Locale.Bulgarian]: 'bg',
    [discord_js_1.default.Locale.Ukrainian]: 'uk',
    [discord_js_1.default.Locale.Croatian]: 'hr',
    [discord_js_1.default.Locale.Romanian]: 'ro',
    [discord_js_1.default.Locale.Lithuanian]: 'lt',
    [discord_js_1.default.Locale.Greek]: 'el',
    [discord_js_1.default.Locale.Hungarian]: 'hu',
    [discord_js_1.default.Locale.Thai]: 'th',
    [discord_js_1.default.Locale.Vietnamese]: 'vi',
    [discord_js_1.default.Locale.Hindi]: 'hi',
    [discord_js_1.default.Locale.Indonesian]: 'id',
};
/**
 * Get all language codes as an array
 */
const getAllLanguageCodes = () => {
    return exports.ALL_LANGUAGES.map(lang => lang.code);
};
exports.getAllLanguageCodes = getAllLanguageCodes;
/**
 * Find language info by code
 */
const getLanguageByCode = (code) => {
    return exports.ALL_LANGUAGES.find(lang => lang.code === code);
};
exports.getLanguageByCode = getLanguageByCode;
/**
 * Map our language code to Discord locale
 */
const mapToDiscordLocale = (languageCode) => {
    return exports.LANGUAGE_TO_DISCORD_LOCALE[languageCode] || null;
};
exports.mapToDiscordLocale = mapToDiscordLocale;
/**
 * Map Discord locale to our language code
 */
const mapDiscordLocaleToLanguage = (discordLocale, defaultLocale = 'en') => {
    return exports.DISCORD_LOCALE_TO_LANGUAGE[discordLocale] || defaultLocale;
};
exports.mapDiscordLocaleToLanguage = mapDiscordLocaleToLanguage;
