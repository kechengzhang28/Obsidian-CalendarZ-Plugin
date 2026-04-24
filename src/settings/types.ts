/** Supported display languages */
export type Language = "en-US" | "zh-CN";

/** Month display format options */
export type MonthFormat = "numeric" | "short" | "long";

/** Header title format options */
export type TitleFormat = "yearMonth" | "monthYear";

/** Week start day options */
export type WeekStart = "sunday" | "monday";

/** Date source options for extracting dates from notes */
export type DateSource = "yaml" | "filename" | "both";

/** Display mode options for note statistics */
export type DisplayMode = "none" | "dots" | "heatmap";

/** Statistics type options */
export type StatisticsType = "count" | "wordCount";

/**
 * Plugin settings interface.
 * Contains all user-configurable options for the CalendarZ plugin.
 */
export interface CalendarZSettings {
	/** Display language */
	language: Language;
	/** Month display format */
	monthFormat: MonthFormat;
	/** Header title format */
	titleFormat: TitleFormat;
	/** Week start day */
	weekStart: WeekStart;
	/** List of folder paths to ignore when counting notes */
	ignoredFolders: string[];
	/** YAML frontmatter field name for date extraction */
	dateFieldName: string;
	/** Source of date data (YAML frontmatter or filename) */
	dateSource: DateSource;
	/** Date format pattern for filename extraction (e.g., "YYYY-MM-DD") */
	filenameDateFormat: string;
	/** Display mode for note statistics: heatmap, dots, or none */
	displayMode: DisplayMode;
	/** Statistics type: note count or word count */
	statisticsType: StatisticsType;
	/** Number of notes each dot represents (for dots mode) */
	dotThreshold: number;
	/** Number of words each dot represents (for dots mode when statisticsType is wordCount) */
	dotWordThreshold: number;
	/** Maximum note count for heatmap brightness calculation */
	heatmapMaxNotes: number;
	/** Maximum word count for heatmap brightness calculation */
	heatmapMaxWords: number;
	/** Whether to hide date numbers in heatmap mode */
	heatmapHideDateNumbers: boolean;
	/** Whether to confirm before creating a daily note on click */
	confirmBeforeCreate: boolean;
	/** Whether to show week numbers in the calendar */
	showWeekNumber: boolean;
	/** Week note settings */
	weekNoteEnabled: boolean;
	/** Week note template file path */
	weekNoteTemplate: string;
	/** Week note folder path */
	weekNoteFolder: string;
}
