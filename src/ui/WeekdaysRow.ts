import { I18n } from "../i18n";
import { WeekStart } from "../settings";

export class WeekdaysRow {
	private container: HTMLElement;
	private i18n: I18n;
	private weekStart: WeekStart;

	constructor(container: HTMLElement, i18n: I18n, weekStart: WeekStart) {
		this.container = container;
		this.i18n = i18n;
		this.weekStart = weekStart;
	}

	render(): void {
		const weekdayRow = this.container.createDiv({ cls: "calendarz-weekdays" });
		const weekdays = this.getOrderedWeekdays();
		weekdays.forEach((day: string) => {
			weekdayRow.createEl("span", { cls: "calendarz-weekday", text: day });
		});
	}

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
