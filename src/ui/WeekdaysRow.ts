import { I18n } from "../i18n";

export class WeekdaysRow {
	private container: HTMLElement;
	private i18n: I18n;

	constructor(container: HTMLElement, i18n: I18n) {
		this.container = container;
		this.i18n = i18n;
	}

	render(): void {
		const weekdayRow = this.container.createDiv({ cls: "calendarz-weekdays" });
		this.i18n.calendar.weekdays.forEach((day: string) => {
			weekdayRow.createEl("span", { cls: "calendarz-weekday", text: day });
		});
	}
}
