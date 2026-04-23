import {Language} from "./settings/index";

// Import locale files
import enUS from "./locales/en-US.json";
import zhCN from "./locales/zh-CN.json";

/**
 * Internationalization interface defining all translatable strings.
 * This interface matches the structure of locale JSON files.
 */
export interface I18n {
	/** Calendar-related strings */
	calendar: {
		/** Label for the today button */
		today: string;
		/** Array of weekday names starting from Sunday */
		weekdays: string[];
		/** Title displayed in the view tab */
		viewTitle: string;
	};
	/** Settings section titles */
	sectionTitles: {
		/** Basic settings section title */
		basic: string;
		/** Statistics settings section title */
		statistics: string;
		/** Click settings section title */
		click: string;
	};
	/** Settings panel strings */
	settings: {
		/** Language setting strings */
		language: {
			name: string;
			description: string;
		};
		/** Month format setting strings */
		monthFormat: {
			name: string;
			description: string;
			options: {
				numeric: string;
				short: string;
				long: string;
			};
		};
		/** Title format setting strings */
		titleFormat: {
			name: string;
			description: string;
			options: {
				yearMonth: string;
				monthYear: string;
			};
		};
		/** Week start setting strings */
		weekStart: {
			name: string;
			description: string;
			options: {
				sunday: string;
				monday: string;
			};
		};
		/** Ignored folders setting strings */
		ignoredFolders: {
			name: string;
			description: string;
			addButton: string;
			removeButton: string;
			placeholder: string;
			empty: string;
			/** Button to open the management modal */
			manageButton: string;
			/** Currently ignored folders prefix */
			currentlyIgnored: string;
			/** Modal title */
			modalTitle: string;
			/** Add new folder section title */
			addNewFolder: string;
			/** Save button text */
			saveButton: string;
			/** Cancel button text */
			cancelButton: string;
		};
		/** Date field name setting strings */
		dateFieldName: {
			name: string;
			description: string;
		};
		/** Date source setting strings */
		dateSource: {
			name: string;
			description: string;
			options: {
				yaml: string;
				filename: string;
			};
		};
		/** Filename date format setting strings */
		filenameDateFormat: {
			name: string;
			description: string;
		};
		/** Display mode setting strings */
		displayMode: {
			name: string;
			description: string;
			options: {
				heatmap: string;
				dots: string;
				none: string;
			};
		};
		/** Dot threshold setting strings */
		dotThreshold: {
			name: string;
			description: string;
		};
		/** Confirm before creating daily note setting strings */
		confirmBeforeCreate: {
			name: string;
			description: string;
		};
	};
	/** Command names */
	commands: {
		/** Name of the open calendar command */
		openCalendar: string;
	};
	/** Ribbon icon tooltip */
	ribbon: {
		/** Tooltip text for the ribbon icon */
		tooltip: string;
	};
	/** Notification messages */
	notifications: {
		/** Message shown when daily notes plugin is not enabled */
		dailyNotesNotEnabled: string;
		/** Message shown when daily note creation fails */
		dailyNotesCreateFailed: string;
	};
	/** Modal dialog strings */
	modal: {
		/** Confirm modal title */
		confirmTitle: string;
		/** Confirm modal message template with {{date}} placeholder */
		confirmMessage: string;
		/** Cancel button text */
		cancelButton: string;
		/** Create button text */
		createButton: string;
	};
}

/** Map of language codes to their locale data */
const locales: Record<Language, I18n> = {
	"en-US": enUS as I18n,
	"zh-CN": zhCN as I18n,
};

/**
 * Loads the i18n strings for the specified language.
 * Falls back to English if the language is not available.
 * @param language - Language code to load
 * @returns I18n object containing all translatable strings
 */
export function loadI18n(language: Language): I18n {
	return locales[language] || locales["en-US"];
}

/**
 * Interpolates variables into a template string.
 * Replaces {{key}} placeholders with values from the vars object.
 * @param template - Template string with {{key}} placeholders
 * @param vars - Object containing variable values
 * @returns Interpolated string
 */
export function interpolate(template: string, vars: Record<string, string | number>): string {
	return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(vars[key] ?? ""));
}
