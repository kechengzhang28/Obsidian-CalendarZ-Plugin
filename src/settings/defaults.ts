import type {CalendarZSettings} from "../core/types";

/**
 * Default settings values for the CalendarZ plugin.
 * Used as fallback when user has not customized a setting.
 */
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
	showWeekNumber: false,
	weekNoteEnabled: false,
	weekNoteTemplate: "",
	weekNoteFolder: "",
	weekNoteFormat: "YYYY-[W]WW",
	monthNoteEnabled: false,
	monthNoteTemplate: "",
	monthNoteFolder: "",
	monthNoteFormat: "YYYY-MM",
	yearNoteEnabled: false,
	yearNoteTemplate: "",
	yearNoteFolder: "",
	yearNoteFormat: "YYYY",
	hideCompletedTodos: false,
};
