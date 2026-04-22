import discord from 'discord.js';

/**
 * Language definitions used throughout the application
 */
export interface LanguageInfo {
	code: string;
	name: string;
}

/**
 * Complete list of all supported languages with their codes and native names
 */
export const ALL_LANGUAGES: readonly LanguageInfo[] = [
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
	{ code: 'da', name: 'Dansk' },
	{ code: 'cs', name: 'Čeština' },
	{ code: 'hu', name: 'Magyar' },
	{ code: 'th', name: 'ไทย' },
	{ code: 'vi', name: 'Tiếng Việt' },
	{ code: 'hi', name: 'हिन्दी' },
	{ code: 'id', name: 'Bahasa Indonesia' },
] as const;

/**
 * Mapping from our language codes to Discord locales
 */
export const LANGUAGE_TO_DISCORD_LOCALE: Record<string, discord.Locale> = {
	en: discord.Locale.EnglishUS,
	es: discord.Locale.SpanishES,
	fr: discord.Locale.French,
	de: discord.Locale.German,
	pt: discord.Locale.PortugueseBR,
	ja: discord.Locale.Japanese,
	ko: discord.Locale.Korean,
	zh: discord.Locale.ChineseCN,
	ru: discord.Locale.Russian,
	it: discord.Locale.Italian,
	nl: discord.Locale.Dutch,
	pl: discord.Locale.Polish,
	tr: discord.Locale.Turkish,
	sv: discord.Locale.Swedish,
	da: discord.Locale.Danish,
	cs: discord.Locale.Czech,
	hu: discord.Locale.Hungarian,
	th: discord.Locale.Thai,
	vi: discord.Locale.Vietnamese,
	hi: discord.Locale.Hindi,
	id: discord.Locale.Indonesian,
};

/**
 * Mapping from Discord locales to our language codes
 */
export const DISCORD_LOCALE_TO_LANGUAGE: Record<string, string> = {
	[discord.Locale.EnglishUS]: 'en',
	[discord.Locale.EnglishGB]: 'en',
	[discord.Locale.SpanishES]: 'es',
	[discord.Locale.French]: 'fr',
	[discord.Locale.German]: 'de',
	[discord.Locale.PortugueseBR]: 'pt',
	[discord.Locale.Japanese]: 'ja',
	[discord.Locale.Korean]: 'ko',
	[discord.Locale.ChineseCN]: 'zh',
	[discord.Locale.Russian]: 'ru',
	[discord.Locale.Italian]: 'it',
	[discord.Locale.Dutch]: 'nl',
	[discord.Locale.Polish]: 'pl',
	[discord.Locale.Turkish]: 'tr',
	[discord.Locale.Swedish]: 'sv',
	[discord.Locale.Danish]: 'da',
	[discord.Locale.Czech]: 'cs',
	[discord.Locale.Hungarian]: 'hu',
	[discord.Locale.Thai]: 'th',
	[discord.Locale.Vietnamese]: 'vi',
	[discord.Locale.Hindi]: 'hi',
	[discord.Locale.Indonesian]: 'id',
};

/**
 * Get all language codes as an array
 */
export const getAllLanguageCodes = (): string[] => {
	return ALL_LANGUAGES.map(lang => lang.code);
};

/**
 * Find language info by code
 */
export const getLanguageByCode = (code: string): LanguageInfo | undefined => {
	return ALL_LANGUAGES.find(lang => lang.code === code);
};

/**
 * Map our language code to Discord locale
 */
export const mapToDiscordLocale = (languageCode: string): discord.Locale | null => {
	return LANGUAGE_TO_DISCORD_LOCALE[languageCode] || null;
};

/**
 * Map Discord locale to our language code
 */
export const mapDiscordLocaleToLanguage = (discordLocale: string, defaultLocale: string = 'en'): string => {
	return DISCORD_LOCALE_TO_LANGUAGE[discordLocale] || defaultLocale;
};
