/**
 * CalendarZ constants
 * Centralized location for all magic numbers and constant values
 */

/** Date format for internal storage and display */
export const DATE_FORMAT = "YYYY-MM-DD" as const;

/** Heatmap opacity calculation constants */
export const HEATMAP = {
	/** Minimum opacity for heatmap cells */
	MIN_OPACITY: 0.25,
	/** Maximum opacity for heatmap cells */
	MAX_OPACITY: 1.0,
	/** Opacity range (MAX - MIN) */
	get OPACITY_RANGE() {
		return this.MAX_OPACITY - this.MIN_OPACITY;
	},
} as const;

/** Dots display mode constants */
export const DOTS = {
	/** Maximum number of dots to display */
	MAX_DOTS: 4,
} as const;

/** Calendar grid layout constants */
export const GRID = {
	/** Total cells in a 6-row calendar grid (6 weeks × 7 days) */
	TOTAL_CELLS: 42,
	/** Days in a week */
	DAYS_PER_WEEK: 7,
} as const;

/** Day of week indices */
export const DAY_OF_WEEK = {
	SUNDAY: 0,
	MONDAY: 1,
} as const;

/** CSS class names for calendar elements */
export const CSS_CLASSES = {
	CONTAINER: "calendarz-container",
	DAYS: "calendarz-days",
	DAY: "calendarz-day",
	DAY_OTHER_MONTH: "calendarz-day-other-month",
	DAY_TODAY: "calendarz-day-today",
	DAY_TODAY_THEMED: "calendarz-day-today-themed",
	DAY_HEATMAP: "calendarz-day-heatmap",
	DOTS_CONTAINER: "calendarz-dots-container",
	DOT: "calendarz-dot",
	DOT_GRAY: "calendarz-dot-gray",
	BAR_TODAY: "calendarz-bar-today",
} as const;

/** CSS custom property names */
export const CSS_VARS = {
	HEATMAP_OPACITY: "--heatmap-opacity",
} as const;

/** HTML attribute names */
export const ATTRS = {
	DATA_COUNT: "data-count",
	DATA_DATE: "data-date",
	ARIA_LABEL: "aria-label",
	ARIA_HIDDEN: "aria-hidden",
} as const;

/** Default values for settings */
export const DEFAULTS = {
	/** Default date field name for YAML source */
	DATE_FIELD_NAME: "date",
	/** Default filename date format */
	FILENAME_DATE_FORMAT: "YYYY-MM-DD",
	/** Default date format placeholder for text input */
	DATE_FORMAT_PLACEHOLDER: "date",
	/** Default filename format placeholder */
	FILENAME_FORMAT_PLACEHOLDER: "YYYY-MM-DD",
} as const;

/** Display mode values */
export const DISPLAY_MODE = {
	NONE: "none",
	DOTS: "dots",
	HEATMAP: "heatmap",
} as const;

/** Date source values */
export const DATE_SOURCE = {
	YAML: "yaml",
	FILENAME: "filename",
	BOTH: "both",
} as const;

/** Statistics type values */
export const STATISTICS_TYPE = {
	COUNT: "count",
	WORD_COUNT: "wordCount",
} as const;
