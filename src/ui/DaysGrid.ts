import dayjs from "dayjs";
import { WeekStart, DisplayMode } from "../settings/index";

/**
 * Interface representing the count of notes for a specific date
 */
export interface DateCount {
	/** Date string in YYYY-MM-DD format */
	date: string;
	/** Number of notes for this date */
	count: number;
}

/**
 * Renders the days grid for the calendar.
 * Displays days of the current month, plus padding days from previous/next months.
 * Supports heatmap visualization and dots display modes.
 */
export class DaysGrid {
	/** Container element for the grid */
	private container: HTMLElement;
	/** Week start preference (sunday or monday) */
	private weekStart: WeekStart;
	/** Display mode for note statistics */
	private displayMode: DisplayMode;
	/** Number of notes each dot represents (for dots mode) */
	private dotThreshold: number;
	/** Map storing note counts keyed by date string */
	private dateCounts: Map<string, number> = new Map();

	/**
	 * Creates a new DaysGrid instance.
	 * @param container - Parent container element
	 * @param weekStart - Week start day preference
	 * @param displayMode - Display mode for note statistics
	 * @param dotThreshold - Number of notes each dot represents
	 */
	constructor(container: HTMLElement, weekStart: WeekStart, displayMode: DisplayMode, dotThreshold: number = 1) {
		this.container = container;
		this.weekStart = weekStart;
		this.displayMode = displayMode;
		this.dotThreshold = dotThreshold;
	}

	/**
	 * Renders the days grid for the specified month.
	 * @param currentDate - The date representing the month to display
	 * @param dateCounts - Array of date-count pairs for heatmap (optional)
	 */
	render(currentDate: Date, dateCounts?: DateCount[]): void {
		// Clear previous data and populate the date counts map
		this.dateCounts.clear();
		if (dateCounts) {
			for (const item of dateCounts) {
				this.dateCounts.set(item.date, item.count);
			}
		}

		const daysGrid = this.container.createDiv({ cls: "calendarz-days" });

		const current = dayjs(currentDate);
		const year = current.year();
		const month = current.month();

		const firstDay = dayjs(new Date(year, month, 1));
		const lastDay = dayjs(new Date(year, month + 1, 0));
		const daysInMonth = lastDay.date();
		const startingDayOfWeek = this.getAdjustedDayOfWeek(firstDay.day());

		const today = dayjs();
		const maxCount = this.getMaxCount();

		// Render padding days from previous month
		const prevMonthLastDay = dayjs(new Date(year, month, 0)).date();
		for (let i = startingDayOfWeek - 1; i >= 0; i--) {
			const prevDay = prevMonthLastDay - i;
			const dayEl = daysGrid.createDiv({ cls: "calendarz-day calendarz-day-other-month" });
			dayEl.textContent = prevDay.toString();
		}

		// Render days of current month
		for (let day = 1; day <= daysInMonth; day++) {
			const date = dayjs(new Date(year, month, day));
			const dateStr = date.format("YYYY-MM-DD");
			const count = this.dateCounts.get(dateStr) || 0;

			const dayEl = daysGrid.createDiv({ cls: "calendarz-day" });
			dayEl.textContent = day.toString();

			// Check if today
			const isToday = this.isSameDate(date, today);
			if (isToday) {
				dayEl.addClass("calendarz-day-today");
			}

			// Apply display mode specific styling
			if (this.displayMode === "heatmap" && count > 0) {
				dayEl.addClass("calendarz-day-heatmap");
				const intensity = maxCount > 0 ? count / maxCount : 0;
				const opacity = 0.25 + intensity * 0.75;
				dayEl.style.setProperty("--heatmap-opacity", opacity.toFixed(2));
				dayEl.setAttribute("data-count", count.toString());
				dayEl.setAttribute("aria-label", `${dateStr}: ${count} notes`);
			}

			// Add dots for dots mode
			if (this.displayMode === "dots" && count > 0) {
				this.renderDots(dayEl, count);
				dayEl.setAttribute("aria-label", `${dateStr}: ${count} notes`);
			}

			// For non-heatmap modes, apply theme color to today's date
			if (isToday && this.displayMode !== "heatmap") {
				dayEl.addClass("calendarz-day-today-themed");
			}

			// Add today indicator dot for heatmap mode
			if (isToday && this.displayMode === "heatmap") {
				const todayIndicator = dayEl.createDiv({ cls: "calendarz-today-indicator" });
				todayIndicator.setAttribute("aria-hidden", "true");
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
	 * Finds the maximum note count in the current dataset
	 * Used for normalizing opacity levels
	 * @returns The highest note count value
	 */
	private getMaxCount(): number {
		let max = 0;
		for (const count of this.dateCounts.values()) {
			if (count > max) {
				max = count;
			}
		}
		return max;
	}

	/**
	 * Renders dots below the date to represent note count.
	 * Maximum 4 dots, each representing dotThreshold notes.
	 * @param dayEl - The day element to add dots to
	 * @param count - Number of notes for this date
	 */
	private renderDots(dayEl: HTMLElement, count: number): void {
		const dotsContainer = dayEl.createDiv({ cls: "calendarz-dots-container" });
		const numDots = Math.min(4, Math.ceil(count / this.dotThreshold));

		for (let i = 0; i < numDots; i++) {
			dotsContainer.createDiv({ cls: "calendarz-dot" });
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
