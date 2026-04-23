import dayjs from "dayjs";
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
		const current = dayjs(currentDate);

		if (this.titleFormat === "yearMonth") {
			const yearText = monthYearContainer.createEl("span", { cls: "calendarz-year" });
			yearText.textContent = current.year().toString();
			const monthText = monthYearContainer.createEl("span", { cls: "calendarz-month" });
			monthText.textContent = this.formatMonth(currentDate);
		} else {
			const monthText = monthYearContainer.createEl("span", { cls: "calendarz-month" });
			monthText.textContent = this.formatMonth(currentDate);
			const yearText = monthYearContainer.createEl("span", { cls: "calendarz-year" });
			yearText.textContent = current.year().toString();
		}

		const prevBtn = header.createEl("button", { cls: "calendarz-nav-btn" });
		prevBtn.appendChild(this.createSvgIcon("prev"));
		prevBtn.addEventListener("click", () => this.callbacks.onPrevMonth());

		const todayBtn = header.createEl("button", { cls: "calendarz-today-btn", text: `${this.i18n.calendar.today}` });
		todayBtn.addEventListener("click", () => this.callbacks.onToday());

		const nextBtn = header.createEl("button", { cls: "calendarz-nav-btn" });
		nextBtn.appendChild(this.createSvgIcon("next"));
		nextBtn.addEventListener("click", () => this.callbacks.onNextMonth());
	}

	private formatMonth(date: Date): string {
		const current = dayjs(date);
		if (this.language === "zh-CN" && this.monthFormat === "numeric") {
			return (current.month() + 1).toString();
		}
		return current.toDate().toLocaleString(this.language, { month: this.monthFormat as "numeric" | "short" | "long" | undefined });
	}

	private createSvgIcon(direction: "prev" | "next"): SVGSVGElement {
		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute("width", "16");
		svg.setAttribute("height", "16");
		svg.setAttribute("viewBox", "0 0 24 24");
		svg.setAttribute("fill", "none");
		svg.setAttribute("stroke", "currentColor");
		svg.setAttribute("stroke-width", "2");
		svg.setAttribute("stroke-linecap", "round");
		svg.setAttribute("stroke-linejoin", "round");

		const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
		if (direction === "prev") {
			polyline.setAttribute("points", "15 18 9 12 15 6");
		} else {
			polyline.setAttribute("points", "9 18 15 12 9 6");
		}
		svg.appendChild(polyline);
		return svg;
	}
}
