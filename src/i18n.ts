import {Language} from "./settings";

// Import locale files
import enUS from "./locales/en-US.json";
import zhCN from "./locales/zh-CN.json";

export type I18n = typeof enUS;

const locales: Record<Language, I18n> = {
	"en-US": enUS as I18n,
	"zh-CN": zhCN as I18n,
};

export function loadI18n(language: Language): I18n {
	return locales[language] || locales["en-US"];
}

export function interpolate(template: string, vars: Record<string, string | number>): string {
	return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ""));
}
