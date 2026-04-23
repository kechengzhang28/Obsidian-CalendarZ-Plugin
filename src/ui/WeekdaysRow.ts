import { I18n } from "../i18n";
import { WeekStart } from "../settings";

/**
 * Renders the weekday names row (Sun, Mon, Tue, etc.).
 * Adjusts order based on week start preference.
 */
export class WeekdaysRow {
	/** Container element for the row */
	private container: HTMLElement;
	/** Internationalization strings */
	private i18n: I18n;
	/** Week start preference (sunday or monday) */
	private weekStart: WeekStart;

	/**
	 * Creates a new WeekdaysRow instance.
	 * @param container - Parent container element
	 * @param i18n - Internationalization strings
	 * @param weekStart - Week start day preference
	 */
	constructor(container: HTMLElement, i18n: I18n, weekStart: WeekStart) {
		this.container = container;
		this.i18n = i18n;
		this.weekStart = weekStart;
	}

	/**
	 * Renders the weekday names row.
	 */
	render(): void {
		const weekdayRow = this.container.createDiv({ cls: "calendarz-weekdays" });
		const weekdays = this.getOrderedWeekdays();
		weekdays.forEach((day: string) => {
			weekdayRow.createEl("span", { cls: "calendarz-weekday", text: day });
		});
	}

	/**
	 * Returns weekday names in the correct order based on week start preference.
	 * @returns Array of weekday name strings
	 */
	private getOrderedWeekdays(): string[] {
		if (this.weekStart === "monday") {
			const days = [...this.i18n.calendar.weekdays];
			const sunday = days.shift();
			if (sunday) days.push(sunday);
			return days;
		}
		return this.i18n.calendar.weekdays;
	}
}
