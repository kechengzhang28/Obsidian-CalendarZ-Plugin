import {CalendarZSettings} from "./types";

/** Default settings values */
export const DEFAULT_SETTINGS: CalendarZSettings = {
	language: "en-US",
	monthFormat: "numeric",
	titleFormat: "monthYear",
	weekStart: "sunday",
	ignoredFolders: [],
	dateFieldName: "date",
	dateSource: "yaml",
	filenameDateFormat: "YYYY-MM-DD",
	displayMode: "none",
	dotThreshold: 1,
	confirmBeforeCreate: true
};
