import type {CalendarZSettings} from "./types";

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
	statisticsType: "count",
	dotThreshold: 1,
	dotWordThreshold: 100,
	heatmapMaxNotes: 10,
	heatmapMaxWords: 1000,
	heatmapHideDateNumbers: false,
	confirmBeforeCreate: true,
	showWeekNumber: false
};
