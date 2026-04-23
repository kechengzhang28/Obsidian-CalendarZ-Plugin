import {Language} from "./settings";

// Import locale files
import enUS from "./locales/en-US.json";
import zhCN from "./locales/zh-CN.json";

// Define the I18n interface based on the locale structure
export interface I18n {
	calendar: {
		today: string;
		weekdays: string[];
		viewTitle: string;
	};
	settings: {
		language: {
			name: string;
			description: string;
		};
		monthFormat: {
			name: string;
			description: string;
			options: {
				numeric: string;
				short: string;
				long: string;
			};
		};
		titleFormat: {
			name: string;
			description: string;
			options: {
				yearMonth: string;
				monthYear: string;
			};
		};
		weekStart: {
			name: string;
			description: string;
			options: {
				sunday: string;
				monday: string;
			};
		};
		ignoredFolders: {
			name: string;
			description: string;
			addButton: string;
			removeButton: string;
			placeholder: string;
			empty: string;
		};
		dateFieldName: {
			name: string;
			description: string;
		};
		dateSource: {
			name: string;
			description: string;
			options: {
				yaml: string;
				filename: string;
			};
		};
		filenameDateFormat: {
			name: string;
			description: string;
		};
	};
	commands: {
		openCalendar: string;
	};
	ribbon: {
		tooltip: string;
	};
}

const locales: Record<Language, I18n> = {
	"en-US": enUS as I18n,
	"zh-CN": zhCN as I18n,
};

export function loadI18n(language: Language): I18n {
	return locales[language] || locales["en-US"];
}

export function interpolate(template: string, vars: Record<string, string | number>): string {
	return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(vars[key] ?? ""));
}
