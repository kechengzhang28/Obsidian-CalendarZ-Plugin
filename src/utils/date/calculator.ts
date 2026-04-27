import dayjs, { setWeekStart } from "./dayjsConfig";
import type { WeekStart } from "../../core/types";

/**
 * Checks if a date is before today.
 * @param date - Date to check (Date object or dayjs instance)
 * @returns True if the date is in the past
 */
export function isBeforeToday(date: Date | dayjs.Dayjs): boolean {
	return dayjs(date).isBefore(dayjs(), "day");
}

/**
 * Checks if two dates represent the same day.
 * @param date1 - First date to compare
 * @param date2 - Second date to compare
 * @returns True if both dates are the same day
 */
export function isSameDay(date1: Date | dayjs.Dayjs, date2: Date | dayjs.Dayjs): boolean {
	return dayjs(date1).isSame(dayjs(date2), "day");
}

/**
 * Gets the year and month for a date.
 * @param date - Date to extract from
 * @returns Object with year and month (0-11)
 */
export function getYearMonth(date: Date | dayjs.Dayjs): { year: number; month: number } {
	const d = dayjs(date);
	return { year: d.year(), month: d.month() };
}

/**
 * Gets the number of days in a month.
 * @param year - Full year (e.g., 2024)
 * @param month - Month index (0-11)
 * @returns Number of days in the month
 */
export function getDaysInMonth(year: number, month: number): number {
	return dayjs(new Date(year, month, 1)).daysInMonth();
}

/**
 * Gets the last day of the previous month.
 * Used for calculating padding days in the calendar grid.
 *
 * @param year - Full year of current month
 * @param month - Month index (0-11) of current month
 * @returns Last day number of previous month
 */
export function getPreviousMonthLastDay(year: number, month: number): number {
	return dayjs(new Date(year, month, 0)).daysInMonth();
}

/**
 * Calculates padding days needed for the calendar grid.
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
	if (weekStart === "monday") {
		return firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
	}
	return firstDayOfWeek;
}

/**
 * Calculates the week number for a given date.
 *
 * Week numbers are calculated based on the user's weekStart preference using
 * locale-based week numbering (via dayjs weekOfYear plugin):
 * - If weekStart is "monday": Week 1 is the week containing Jan 1st, weeks start on Monday
 * - If weekStart is "sunday": Week 1 is the week containing Jan 1st, weeks start on Sunday
 *
 * Note: This is NOT strict ISO 8601 week numbering (which requires yearStart=4 so week 1
 * contains the first Thursday). Week numbers near year boundaries may differ from ISO 8601.
 *
 * @param date - Date to calculate week number for
 * @param weekStart - Week start preference ("sunday" or "monday")
 * @returns Week number (1-53)
 */
export function getWeekNumber(date: Date, weekStart: WeekStart): number {
	setWeekStart(weekStart);
	return dayjs(date).week();
}


