import { WeekStart } from "../settings";

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
 * HeatMap class for rendering a visual calendar heatmap
 * Displays note activity intensity using opacity levels
 */
export class HeatMap {
	/** Container element where the heatmap will be rendered */
	private container: HTMLElement;
	/** Week start preference (Sunday or Monday) */
	private weekStart: WeekStart;
	/** Map storing note counts keyed by date string */
	private dateCounts: Map<string, number> = new Map();

	/**
	 * Creates a new HeatMap instance
	 * @param container - The DOM element to render the heatmap in
	 * @param weekStart - Whether the week starts on Sunday or Monday
	 */
	constructor(
		container: HTMLElement,
		weekStart: WeekStart
	) {
		this.container = container;
		this.weekStart = weekStart;
	}

	/**
	 * Renders the heatmap for a given month
	 * @param currentDate - The date representing the month to display
	 * @param dateCounts - Array of date-count pairs representing note activity
	 */
	render(currentDate: Date, dateCounts: DateCount[]): void {
		// Clear previous data and populate the date counts map
		this.dateCounts.clear();
		for (const item of dateCounts) {
			this.dateCounts.set(item.date, item.count);
		}

		// Create the main heatmap grid container
		const heatMapGrid = this.container.createDiv({ cls: "calendarz-heatmap" });

		// Extract year and month from the current date
		const year = currentDate.getFullYear();
		const month = currentDate.getMonth();

		// Calculate first and last day of the month
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const daysInMonth = lastDay.getDate();
		const startingDayOfWeek = this.getAdjustedDayOfWeek(firstDay.getDay());

		// Render padding cells for previous month's days
		const prevMonthLastDay = new Date(year, month, 0).getDate();
		for (let i = startingDayOfWeek - 1; i >= 0; i--) {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const prevDay = prevMonthLastDay - i;
			const dayEl = heatMapGrid.createDiv({ cls: "calendarz-heatmap-day calendarz-heatmap-day-other-month" });
			dayEl.textContent = "";
		}

		// Get the maximum count for calculating intensity levels
		const maxCount = this.getMaxCount();

		// Render cells for each day of the current month
		for (let day = 1; day <= daysInMonth; day++) {
			const date = new Date(year, month, day);
			const dateStr = this.formatDate(date);
			const count = this.dateCounts.get(dateStr) || 0;

			// Create the day cell element
			const dayEl = heatMapGrid.createDiv({ cls: "calendarz-heatmap-day" });
			dayEl.textContent = "";

			// Calculate opacity based on activity intensity (0.15 to 1.0)
			const intensity = maxCount > 0 ? count / maxCount : 0;
			const opacity = count > 0 ? 0.25 + intensity * 0.75 : 0.15;
			dayEl.style.opacity = opacity.toString();

			// Add data attributes for styling and accessibility
			if (count > 0) {
				dayEl.setAttribute("data-count", count.toString());
			}

			dayEl.setAttribute("data-date", dateStr);
			dayEl.setAttribute("aria-label", `${dateStr}: ${count} notes`);
		}

		// Calculate and render padding cells for next month's days
		// Total 42 cells = 6 rows × 7 columns for consistent grid layout
		const totalCells = 42;
		const currentCells = startingDayOfWeek + daysInMonth;
		const nextMonthDays = totalCells - currentCells;

		for (let day = 1; day <= nextMonthDays; day++) {
			const dayEl = heatMapGrid.createDiv({ cls: "calendarz-heatmap-day calendarz-heatmap-day-other-month" });
			dayEl.textContent = "";
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
	 * Formats a Date object to YYYY-MM-DD string format
	 * @param date - The date to format
	 * @returns Formatted date string
	 */
	private formatDate(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	}

	/**
	 * Adjusts the day of week based on week start preference
	 * Converts Sunday-based (0-6) to Monday-based (0-6) if needed
	 * @param dayOfWeek - Original day of week (0 = Sunday, 6 = Saturday)
	 * @returns Adjusted day of week (0 = first day of week based on preference)
	 */
	private getAdjustedDayOfWeek(dayOfWeek: number): number {
		if (this.weekStart === "monday") {
			return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
		}
		return dayOfWeek;
	}
}
