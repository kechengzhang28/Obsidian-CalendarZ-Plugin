import dayjs from "dayjs";
import type { WeekStart } from "../../settings/types";
import { DAY_OF_WEEK, HEATMAP } from "../../constants";

/**
 * Checks if a date is before today
 * @param date - Date to check (Date object or dayjs instance)
 * @returns True if the date is in the past
 */
export function isBeforeToday(date: Date | dayjs.Dayjs): boolean {
	return dayjs(date).isBefore(dayjs(), "day");
}

/**
 * Checks if two dates represent the same day
 * @param date1 - First date to compare
 * @param date2 - Second date to compare
 * @returns True if both dates are the same day
 */
export function isSameDay(date1: Date | dayjs.Dayjs, date2: Date | dayjs.Dayjs): boolean {
	return dayjs(date1).isSame(dayjs(date2), "day");
}

/**
 * Adjusts day of week based on week start preference.
 * Converts Sunday-based (0-6) to Monday-based (0-6) if needed.
 * 
 * @param dayOfWeek - Original day of week (0 = Sunday, 6 = Saturday)
 * @param weekStart - Week start preference ("sunday" or "monday")
 * @returns Adjusted day of week (0 = first day based on preference)
 */
export function getAdjustedDayOfWeek(dayOfWeek: number, weekStart: WeekStart): number {
	if (weekStart === "monday") {
		return dayOfWeek === DAY_OF_WEEK.SUNDAY ? 6 : dayOfWeek - 1;
	}
	return dayOfWeek;
}

/**
 * Gets the year and month for a date
 * @param date - Date to extract from
 * @returns Object with year and month (0-11)
 */
export function getYearMonth(date: Date | dayjs.Dayjs): { year: number; month: number } {
	const d = dayjs(date);
	return { year: d.year(), month: d.month() };
}

/**
 * Gets the number of days in a month
 * @param year - Full year (e.g., 2024)
 * @param month - Month index (0-11)
 * @returns Number of days in the month
 */
export function getDaysInMonth(year: number, month: number): number {
	return dayjs(new Date(year, month + 1, 0)).date();
}

/**
 * Gets the last day of the previous month
 * Used for calculating padding days in the calendar grid
 * 
 * @param year - Full year of current month
 * @param month - Month index (0-11) of current month
 * @returns Last day number of previous month
 */
export function getPreviousMonthLastDay(year: number, month: number): number {
	return dayjs(new Date(year, month, 0)).date();
}

/**
 * Calculates heatmap opacity based on count and max count
 * 
 * Returns a value between MIN_OPACITY and MAX_OPACITY based on
 * the ratio of count to maxCount. Used for heatmap visualization.
 * 
 * @param count - Current day's note count
 * @param maxCount - Maximum count across all days (for normalization)
 * @returns Opacity value between MIN_OPACITY and MAX_OPACITY
 */
export function calculateHeatmapOpacity(count: number, maxCount: number): number {
	if (maxCount <= 0) return HEATMAP.MIN_OPACITY;
	const intensity = count / maxCount;
	return HEATMAP.MIN_OPACITY + intensity * HEATMAP.OPACITY_RANGE;
}

/**
 * Calculates the number of dots to display
 * 
 * Each dot represents 'threshold' notes. Returns a value between
 * 0 and maxDots. Used for dots visualization mode.
 * 
 * @param count - Note count for the day
 * @param threshold - Notes per dot
 * @param maxDots - Maximum dots allowed
 * @returns Number of dots to display
 */
export function calculateDotCount(count: number, threshold: number, maxDots: number): number {
	if (count <= 0) return 0;
	return Math.min(maxDots, Math.ceil(count / threshold));
}

/**
 * Calculates padding days needed for the calendar grid
 * 
 * Determines how many days from the previous month should be
 * shown to align the first day of the month with the correct
 * weekday column.
 * 
 * @param year - Target year
 * @param month - Target month (0-11)
 * @param weekStart - Week start preference
 * @returns Number of padding days from previous month
 */
export function calculatePaddingDays(year: number, month: number, weekStart: WeekStart): number {
	const firstDayOfWeek = dayjs(new Date(year, month, 1)).day();
	return getAdjustedDayOfWeek(firstDayOfWeek, weekStart);
}


