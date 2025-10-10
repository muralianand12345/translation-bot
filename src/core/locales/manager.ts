import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import discord from 'discord.js';

import { ILocaleData, IInterpolationData } from '../../types';
import { mapToDiscordLocale, mapDiscordLocaleToLanguage } from '../../types/languages';

export class LocalizationManager {
	private static instance: LocalizationManager;
	private locales: Map<string, ILocaleData> = new Map();
	private readonly defaultLocale: string = 'en';
	private readonly localesPath: string;
	private validationErrors: Map<string, string[]> = new Map();

	private constructor() {
		this.localesPath = path.join(__dirname, '../../../locales');
		this.loadAllLocales();
		this.validateAllLocales();
	}

	public static getInstance = (): LocalizationManager => {
		if (!LocalizationManager.instance) LocalizationManager.instance = new LocalizationManager();
		return LocalizationManager.instance;
	};

	private loadAllLocales = (): void => {
		if (!fs.existsSync(this.localesPath)) {
			fs.mkdirSync(this.localesPath, { recursive: true });
			return;
		}
		const files = fs.readdirSync(this.localesPath).filter((file) => file.endsWith('.yml') || file.endsWith('.yaml'));
		if (files.length === 0) return;
		for (const file of files) {
			const locale = path.basename(file, path.extname(file));
			this.loadLocale(locale);
		}
	};

	private loadLocale = (locale: string): void => {
		const yamlPath = path.join(this.localesPath, `${locale}.yaml`);
		const ymlPath = path.join(this.localesPath, `${locale}.yml`);
		const filePath = fs.existsSync(ymlPath) ? ymlPath : yamlPath;

		if (!fs.existsSync(filePath)) return;

		try {
			const content = fs.readFileSync(filePath, 'utf8');
			const data = yaml.parse(content);

			if (!data || typeof data !== 'object') throw new Error(`Invalid locale data in ${locale}: data is not an object`);
			this.locales.set(locale, data);
		} catch (error) {
			throw new Error(`[LOCALIZATION] Failed to load locale '${locale}': ${error instanceof Error ? error.message : String(error)}`);
		}
	};

	private validateAllLocales = (): void => {
		const englishLocale = this.locales.get(this.defaultLocale);
		if (!englishLocale) throw new Error(`[LOCALIZATION] Default locale '${this.defaultLocale}' not found`);

		const englishKeys = this.getAllKeys(englishLocale);

		for (const [locale, data] of this.locales) {
			if (locale === this.defaultLocale) continue;

			const localeKeys = this.getAllKeys(data);
			const missingKeys = englishKeys.filter((key) => !localeKeys.includes(key));
			const extraKeys = localeKeys.filter((key) => !englishKeys.includes(key));

			if (missingKeys.length > 0 || extraKeys.length > 0) {
				const errors: string[] = [];
				if (missingKeys.length > 0) errors.push(`Missing keys: ${missingKeys.join(', ')}`);
				if (extraKeys.length > 0) errors.push(`Extra keys: ${extraKeys.join(', ')}`);
				this.validationErrors.set(locale, errors);
			}
		}
	};

	private getAllKeys = (obj: Record<string, any>, prefix: string = ''): string[] => {
		const keys: string[] = [];

		for (const [key, value] of Object.entries(obj)) {
			const fullKey = prefix ? `${prefix}.${key}` : key;
			if (value && typeof value === 'object' && !Array.isArray(value)) {
				keys.push(...this.getAllKeys(value, fullKey));
			} else {
				keys.push(fullKey);
			}
		}

		return keys;
	};

	public reloadLocales = (): void => {
		this.locales.clear();
		this.validationErrors.clear();
		this.loadAllLocales();
		this.validateAllLocales();
	};

	public getSupportedLocales = (): string[] => {
		return Array.from(this.locales.keys());
	};

	public isLocaleSupported = (locale: string): boolean => {
		return this.locales.has(locale);
	};

	public getValidationErrors = (locale?: string): Map<string, string[]> | string[] => {
		if (locale) return this.validationErrors.get(locale) || [];
		return this.validationErrors;
	};

	private getNestedValue = (obj: Record<string, any>, path: string): any => {
		try {
			return path.split('.').reduce((current, key) => {
				return current && current[key] !== undefined ? current[key] : null;
			}, obj);
		} catch (error) {
			return null;
		}
	};

	private interpolate = (text: string, data: IInterpolationData = {}): string => {
		if (typeof text !== 'string') return String(text || '');

		try {
			return text.replace(/\{(\w+)\}/g, (match, key) => {
				const value = data[key];
				return value !== undefined ? String(value) : match;
			});
		} catch (error) {
			return text;
		}
	};

	public translate = (key: string, locale: string = this.defaultLocale, data: IInterpolationData = {}): string => {
		if (!key) return '';

		let localeData = this.locales.get(locale);
		let translation = localeData ? this.getNestedValue(localeData, key) : null;

		if (!translation && locale !== this.defaultLocale) {
			localeData = this.locales.get(this.defaultLocale);
			translation = localeData ? this.getNestedValue(localeData, key) : null;
		}

		if (!translation) return key;
		return this.interpolate(translation, data);
	};

	public getCommandLocalizations = (key: string): discord.LocalizationMap => {
		const localizations: discord.LocalizationMap = {};

		for (const [locale, data] of this.locales) {
			if (locale === this.defaultLocale) continue;
			const translation = this.getNestedValue(data, key);
			if (translation && typeof translation === 'string') {
				const discordLocale = mapToDiscordLocale(locale);
				if (discordLocale) localizations[discordLocale] = translation;
			}
		}

		return localizations;
	};

	public mapDiscordLocaleToOurs = (discordLocale: string): string => {
		return mapDiscordLocaleToLanguage(discordLocale, this.defaultLocale);
	};

	public validateLocaleCompleteness = (locale: string): { missingKeys: string[]; extraKeys: string[]; isComplete: boolean } => {
		const englishLocale = this.locales.get(this.defaultLocale);
		const targetLocale = this.locales.get(locale);

		if (!englishLocale || !targetLocale) return { missingKeys: [], extraKeys: [], isComplete: false };

		const englishKeys = this.getAllKeys(englishLocale);
		const targetKeys = this.getAllKeys(targetLocale);
		const missingKeys = englishKeys.filter((key) => !targetKeys.includes(key));
		const extraKeys = targetKeys.filter((key) => !englishKeys.includes(key));

		return { missingKeys, extraKeys, isComplete: missingKeys.length === 0 && extraKeys.length === 0 };
	};

	public getLocaleStats = (): Record<string, { totalKeys: number; missingKeys: number; completeness: number }> => {
		const stats: Record<string, { totalKeys: number; missingKeys: number; completeness: number }> = {};
		const englishLocale = this.locales.get(this.defaultLocale);

		if (!englishLocale) return stats;

		const totalEnglishKeys = this.getAllKeys(englishLocale).length;

		for (const [locale, _data] of this.locales) {
			if (locale === this.defaultLocale) {
				stats[locale] = { totalKeys: totalEnglishKeys, missingKeys: 0, completeness: 100 };
				continue;
			}
			const validation = this.validateLocaleCompleteness(locale);
			const completeness = Math.round(((totalEnglishKeys - validation.missingKeys.length) / totalEnglishKeys) * 100);
			stats[locale] = { totalKeys: totalEnglishKeys, missingKeys: validation.missingKeys.length, completeness };
		}
		return stats;
	};
}
