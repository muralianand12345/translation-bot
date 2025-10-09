import discord from 'discord.js';

import client from '../../bot';
import { LocalizationManager } from './manager';
import user_data from '../../events/database/schema/user_data';
import { ALL_LANGUAGES, LanguageInfo, getAllLanguageCodes } from '../../constants/languages';

export class LocaleDetector {
	private localizationManager: LocalizationManager;
	private readonly supportedLanguages: LanguageInfo[];

	constructor() {
		this.localizationManager = LocalizationManager.getInstance();
		this.supportedLanguages = this.initializeSupportedLanguages(true);
	}

	private initializeSupportedLanguages = (returnAll: boolean = false): LanguageInfo[] => {
		if (returnAll) return [...ALL_LANGUAGES];
		const supportedCodes = this.localizationManager.getSupportedLocales();
		const filteredLanguages = ALL_LANGUAGES.filter((lang) => supportedCodes.includes(lang.code));
		return filteredLanguages;
	};

	private validateLanguageCode = (language: string): boolean => {
		if (!language || typeof language !== 'string') return false;
		return this.supportedLanguages.some((lang) => lang.code === language);
	};

	public getUserLanguage = async (userId: string): Promise<string | null> => {
		try {
			if (!userId) return null;
			const user = await user_data.findOne({ userId }).lean();
			const language = user?.language;
			if (language && !this.validateLanguageCode(language)) {
				await this.setUserLanguage(userId, null);
				return null;
			}
			return language || null;
		} catch (error) {
			client.logger.error(`[LOCALE_DETECTOR] Error getting user language for ${userId}: ${error}`);
			return null;
		}
	};

	public setUserLanguage = async (userId: string, language: string | null): Promise<boolean> => {
		try {
			if (!userId) return false;
			if (language && !this.validateLanguageCode(language)) return false;
			await user_data.findOneAndUpdate({ userId }, { language }, { upsert: true, new: true });
			return true;
		} catch (error) {
			client.logger.error(`[LOCALE_DETECTOR] Error setting user language for ${userId}: ${error}`);
			return false;
		}
	};

	public detectLocale = async (interaction: discord.ChatInputCommandInteraction | discord.ButtonInteraction | discord.AutocompleteInteraction | discord.ModalSubmitInteraction | discord.SelectMenuInteraction | discord.MessageComponentInteraction | unknown): Promise<string> => {
		try {
			if (!interaction || typeof interaction !== 'object' || !('user' in interaction) || !interaction.user || typeof interaction.user !== 'object' || !('id' in interaction.user) || typeof interaction.user.id !== 'string') return 'en';
			const userLanguage = await this.getUserLanguage(interaction.user.id);
			if (userLanguage && this.localizationManager.isLocaleSupported(userLanguage)) return userLanguage;

			if ('locale' in interaction && typeof interaction.locale === 'string') {
				const discordLocale = this.localizationManager.mapDiscordLocaleToOurs(interaction.locale);
				if (this.localizationManager.isLocaleSupported(discordLocale)) return discordLocale;
			}

			return 'en';
		} catch (error) {
			client.logger.error(`[LOCALE_DETECTOR] Error detecting locale: ${error}`);
			return 'en';
		}
	};

	public getTranslator = async (interaction: discord.ChatInputCommandInteraction | discord.ButtonInteraction | discord.AutocompleteInteraction | discord.ModalSubmitInteraction | discord.SelectMenuInteraction | discord.MessageComponentInteraction | unknown) => {
		const locale = await this.detectLocale(interaction);
		return (key: string, data?: Record<string, string | number>) => {
			return this.localizationManager.translate(key, locale, data);
		};
	};

	public isLanguageSupported = (language: string): boolean => {
		return this.validateLanguageCode(language);
	};

	public getSupportedLanguages = (): LanguageInfo[] => {
		return [...this.supportedLanguages];
	};

	public getLanguageStats = (): { total: number; supported: number; missing: number; supportedCodes: string[]; missingCodes: string[] } => {
		const allCodes = getAllLanguageCodes();

		const supportedCodes = this.supportedLanguages.map((lang) => lang.code);
		const missingCodes = allCodes.filter((code) => !supportedCodes.includes(code));
		return { total: allCodes.length, supported: supportedCodes.length, missing: missingCodes.length, supportedCodes, missingCodes };
	};

	public validateUserLanguage = async (userId: string): Promise<{ isValid: boolean; currentLanguage: string | null; needsUpdate: boolean }> => {
		const currentLanguage = await this.getUserLanguage(userId);
		if (!currentLanguage) return { isValid: true, currentLanguage: null, needsUpdate: false };
		const isValid = this.validateLanguageCode(currentLanguage);
		return { isValid, currentLanguage, needsUpdate: !isValid };
	};

	public getAvailableLanguagesForUser = (query: string = ''): LanguageInfo[] => {
		const lowerQuery = query.toLowerCase();
		return this.supportedLanguages.filter((lang) => lang.name.toLowerCase().includes(lowerQuery) || lang.code.toLowerCase().includes(lowerQuery));
	};

	public getLocaleFromDiscordLocale = (discordLocale: string): string => {
		const mappedLocale = this.localizationManager.mapDiscordLocaleToOurs(discordLocale);
		if (this.localizationManager.isLocaleSupported(mappedLocale)) return mappedLocale;
		return 'en';
	};
}
