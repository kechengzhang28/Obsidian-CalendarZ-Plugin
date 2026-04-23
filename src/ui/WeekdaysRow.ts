import type { I18n } from "../i18n";
import type { WeekStart } from "../settings/index";

/**
 * Renders the weekday names row (Sun, Mon, Tue, etc.).
 */
export class WeekdaysRow {
	constructor(
		private container: HTMLElement,
		private i18n: I18n,
		private weekStart: WeekStart
	) {}

	/**
	 * Renders the weekday names row.
	 */
	render(): void {
		const weekdayRow = this.container.createDiv({ cls: "calendarz-weekdays" });
		
		for (const day of this.getOrderedWeekdays()) {
			weekdayRow.createEl("span", { cls: "calendarz-weekday", text: day });
		}
	}

	/**
	 * Returns weekday names in the correct order based on week start preference.
	 */
	private getOrderedWeekdays(): string[] {
		const days = [...this.i18n.calendar.weekdays];
		
		if (this.weekStart === "monday") {
			const sunday = days.shift();
			if (sunday) days.push(sunday);
		}
		
		return days;
	}
}
