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
	MAX_DOTS: 3,
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

/** CSS class names for calendar elements (BEM naming) */
export const CSS_CLASSES = {
	CONTAINER: "calendarz",
	HEADER: "calendarz__header",
	HEADER_TITLE: "calendarz__header-title",
	MONTH: "calendarz__month",
	YEAR: "calendarz__year",
	MONTH_CLICKABLE: "calendarz__month--clickable",
	YEAR_CLICKABLE: "calendarz__year--clickable",
	BTN: "calendarz__btn",
	BTN_NAV: "calendarz__btn--nav",
	BTN_TODAY: "calendarz__btn--today",
	BTN_REMOVE: "calendarz__btn--remove",
	WEEKDAYS: "calendarz__weekdays",
	WEEKDAYS_WITH_WEEK: "calendarz__weekdays--with-week",
	WEEKDAY: "calendarz__weekday",
	WEEKDAY_LABEL: "calendarz__weekday-label",
	DAYS: "calendarz__days",
	DAYS_WITH_WEEK: "calendarz__days--with-week",
	DAY: "calendarz__day",
	DAY_EMPTY: "calendarz__day--empty",
	DAY_OTHER_MONTH: "calendarz__day--other-month",
	DAY_TODAY: "calendarz__day--today",
	DAY_TODAY_THEMED: "calendarz__day--today-themed",
	DAY_HEATMAP: "calendarz__day--heatmap",
	DAY_HEATMAP_EMPTY: "calendarz__day--heatmap-empty",
	WEEK_NUMBER: "calendarz__week-number",
	WEEK_NUMBER_CLICKABLE: "calendarz__week-number--clickable",
	DOTS: "calendarz__dots",
	DOT: "calendarz__dot",
	DOT_MUTED: "calendarz__dot--muted",
	INDICATOR: "calendarz__indicator",
	INDICATOR_BAR: "calendarz__indicator--bar",
	INDICATOR_ICON: "calendarz__indicator--icon",
	TODO: "calendarz__todo",
	TODO_PENDING: "calendarz__todo--pending",
	TODO_COMPLETED: "calendarz__todo--completed",
	SETTINGS_FOLDER: "calendarz__settings-folder",
	SETTINGS_HEADING: "calendarz__settings-heading",
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
