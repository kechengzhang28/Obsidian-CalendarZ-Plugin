import { I18n } from "../i18n";
import { TitleFormat } from "../settings";

export interface CalendarHeaderCallbacks {
	onPrevMonth: () => void;
	onNextMonth: () => void;
	onToday: () => void;
}

export class CalendarHeader {
	private container: HTMLElement;
	private i18n: I18n;
	private monthFormat: string;
	private language: string;
	private titleFormat: TitleFormat;
	private callbacks: CalendarHeaderCallbacks;

	constructor(
		container: HTMLElement,
		i18n: I18n,
		monthFormat: string,
		language: string,
		titleFormat: TitleFormat,
		callbacks: CalendarHeaderCallbacks
	) {
		this.container = container;
		this.i18n = i18n;
		this.monthFormat = monthFormat;
		this.language = language;
		this.titleFormat = titleFormat;
		this.callbacks = callbacks;
	}

	render(currentDate: Date): void {
		const header = this.container.createDiv({ cls: "calendarz-header" });

		const monthYearContainer = header.createDiv({ cls: "calendarz-month-year" });

		if (this.titleFormat === "yearMonth") {
			const yearText = monthYearContainer.createEl("span", { cls: "calendarz-year" });
			yearText.textContent = currentDate.getFullYear().toString();
			const monthText = monthYearContainer.createEl("span", { cls: "calendarz-month" });
			monthText.textContent = this.formatMonth(currentDate);
		} else {
			const monthText = monthYearContainer.createEl("span", { cls: "calendarz-month" });
			monthText.textContent = this.formatMonth(currentDate);
			const yearText = monthYearContainer.createEl("span", { cls: "calendarz-year" });
			yearText.textContent = currentDate.getFullYear().toString();
		}

		const prevBtn = header.createEl("button", { cls: "calendarz-nav-btn" });
		prevBtn.innerHTML = "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='15 18 9 12 15 6'></polyline></svg>";
		prevBtn.addEventListener("click", () => this.callbacks.onPrevMonth());

		const todayBtn = header.createEl("button", { cls: "calendarz-today-btn", text: `${this.i18n.calendar.today}` });
		todayBtn.addEventListener("click", () => this.callbacks.onToday());

		const nextBtn = header.createEl("button", { cls: "calendarz-nav-btn" });
		nextBtn.innerHTML = "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='9 18 15 12 9 6'></polyline></svg>";
		nextBtn.addEventListener("click", () => this.callbacks.onNextMonth());
	}

	private formatMonth(date: Date): string {
		if (this.language === "zh-CN" && this.monthFormat === "numeric") {
			return (date.getMonth() + 1).toString();
		}
		return date.toLocaleString(this.language, { month: this.monthFormat as any });
	}
}
