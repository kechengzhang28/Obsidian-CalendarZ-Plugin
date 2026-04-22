import {Language} from "./settings";

// Import locale files
import en from "./locales/en.json";
import zh from "./locales/zh.json";

export type I18n = typeof en;

const locales: Record<Language, I18n> = {
	en: en as I18n,
	zh: zh as I18n,
};

export function loadI18n(language: Language): I18n {
	return locales[language] || locales.en;
}

export function interpolate(template: string, vars: Record<string, string | number>): string {
	return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ""));
}
