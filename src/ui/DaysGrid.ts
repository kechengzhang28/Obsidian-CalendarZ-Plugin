import dayjs from "dayjs";
import { WeekStart } from "../settings";

/**
 * Renders the days grid for the calendar.
 * Displays days of the current month, plus padding days from previous/next months.
 */
export class DaysGrid {
	/** Container element for the grid */
	private container: HTMLElement;
	/** Week start preference (sunday or monday) */
	private weekStart: WeekStart;

	/**
	 * Creates a new DaysGrid instance.
	 * @param container - Parent container element
	 * @param weekStart - Week start day preference
	 */
	constructor(container: HTMLElement, weekStart: WeekStart) {
		this.container = container;
		this.weekStart = weekStart;
	}

	/**
	 * Renders the days grid for the specified month.
	 * @param currentDate - The date representing the month to display
	 */
	render(currentDate: Date): void {
		const daysGrid = this.container.createDiv({ cls: "calendarz-days" });

		const current = dayjs(currentDate);
		const year = current.year();
		const month = current.month();

		const firstDay = dayjs(new Date(year, month, 1));
		const lastDay = dayjs(new Date(year, month + 1, 0));
		const daysInMonth = lastDay.date();
		const startingDayOfWeek = this.getAdjustedDayOfWeek(firstDay.day());

		const today = dayjs();

		// Render padding days from previous month
		const prevMonthLastDay = dayjs(new Date(year, month, 0)).date();
		for (let i = startingDayOfWeek - 1; i >= 0; i--) {
			const prevDay = prevMonthLastDay - i;
			const dayEl = daysGrid.createDiv({ cls: "calendarz-day calendarz-day-other-month" });
			dayEl.textContent = prevDay.toString();
		}

		// Render days of current month
		for (let day = 1; day <= daysInMonth; day++) {
			const date = new Date(year, month, day);
			const dayEl = daysGrid.createDiv({ cls: "calendarz-day" });
			dayEl.textContent = day.toString();

			if (this.isSameDate(dayjs(date), today)) {
				dayEl.addClass("calendarz-day-today");
			}
		}

		// Render padding days from next month (to fill 6 rows)
		const totalCells = 42;
		const currentCells = startingDayOfWeek + daysInMonth;
		const nextMonthDays = totalCells - currentCells;

		for (let day = 1; day <= nextMonthDays; day++) {
			const dayEl = daysGrid.createDiv({ cls: "calendarz-day calendarz-day-other-month" });
			dayEl.textContent = day.toString();
		}
	}

	/**
	 * Checks if two dates represent the same day.
	 * @param date1 - First date to compare
	 * @param date2 - Second date to compare
	 * @returns true if dates are the same day
	 */
	private isSameDate(date1: dayjs.Dayjs, date2: dayjs.Dayjs): boolean {
		return date1.isSame(date2, "day");
	}

	/**
	 * Adjusts day of week based on week start preference.
	 * Converts Sunday-based (0-6) to Monday-based (0-6) if needed.
	 * @param dayOfWeek - Original day of week (0 = Sunday, 6 = Saturday)
	 * @returns Adjusted day of week (0 = first day based on preference)
	 */
	private getAdjustedDayOfWeek(dayOfWeek: number): number {
		if (this.weekStart === "monday") {
			return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
		}
		return dayOfWeek;
	}
}
