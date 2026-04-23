import dayjs from "dayjs";
import { WeekStart } from "../../settings/types";
import { DAY_OF_WEEK, GRID, HEATMAP } from "../../constants";

/**
 * Checks if a date is today
 */
export function isToday(date: Date | dayjs.Dayjs): boolean {
	return dayjs(date).isSame(dayjs(), "day");
}

/**
 * Checks if a date is before today
 */
export function isBeforeToday(date: Date | dayjs.Dayjs): boolean {
	return dayjs(date).isBefore(dayjs(), "day");
}

/**
 * Checks if two dates represent the same day
 */
export function isSameDay(date1: Date | dayjs.Dayjs, date2: Date | dayjs.Dayjs): boolean {
	return dayjs(date1).isSame(dayjs(date2), "day");
}

/**
 * Adjusts day of week based on week start preference.
 * Converts Sunday-based (0-6) to Monday-based (0-6) if needed.
 */
export function getAdjustedDayOfWeek(dayOfWeek: number, weekStart: WeekStart): number {
	if (weekStart === "monday") {
		return dayOfWeek === DAY_OF_WEEK.SUNDAY ? 6 : dayOfWeek - 1;
	}
	return dayOfWeek;
}

/**
 * Gets the year and month for a date
 */
export function getYearMonth(date: Date | dayjs.Dayjs): { year: number; month: number } {
	const d = dayjs(date);
	return { year: d.year(), month: d.month() };
}

/**
 * Gets the number of days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
	return dayjs(new Date(year, month + 1, 0)).date();
}

/**
 * Gets the last day of the previous month
 */
export function getPreviousMonthLastDay(year: number, month: number): number {
	return dayjs(new Date(year, month, 0)).date();
}

/**
 * Calculates heatmap opacity based on count and max count
 */
export function calculateHeatmapOpacity(count: number, maxCount: number): number {
	if (maxCount <= 0) return HEATMAP.MIN_OPACITY;
	const intensity = count / maxCount;
	return HEATMAP.MIN_OPACITY + intensity * HEATMAP.OPACITY_RANGE;
}

/**
 * Calculates the number of dots to display
 */
export function calculateDotCount(count: number, threshold: number, maxDots: number): number {
	if (count <= 0) return 0;
	return Math.min(maxDots, Math.ceil(count / threshold));
}

/**
 * Calculates padding days needed for the calendar grid
 */
export function calculatePaddingDays(year: number, month: number, weekStart: WeekStart): number {
	const firstDayOfWeek = dayjs(new Date(year, month, 1)).day();
	return getAdjustedDayOfWeek(firstDayOfWeek, weekStart);
}

/**
 * Calculates the number of days to show from next month
 */
export function calculateNextMonthDays(paddingDays: number, daysInMonth: number): number {
	const currentCells = paddingDays + daysInMonth;
	return GRID.TOTAL_CELLS - currentCells;
}

/**
 * Gets adjacent month info
 */
export function getAdjacentMonth(
	year: number,
	month: number,
	direction: -1 | 1
): { year: number; month: number } {
	let newMonth = month + direction;
	let newYear = year;

	if (newMonth < 0) {
		newMonth = 11;
		newYear--;
	} else if (newMonth > 11) {
		newMonth = 0;
		newYear++;
	}

	return { year: newYear, month: newMonth };
}
