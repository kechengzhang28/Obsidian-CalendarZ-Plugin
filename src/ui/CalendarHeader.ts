import dayjs from "dayjs";
import { I18n } from "../i18n";
import { TitleFormat } from "../settings/index";

export interface CalendarHeaderCallbacks {
	onPrevMonth: () => void;
	onNextMonth: () => void;
	onToday: () => void;
}

/**
 * Renders the calendar header with month/year display and navigation buttons.
 */
export class CalendarHeader {
	constructor(
		private container: HTMLElement,
		private i18n: I18n,
		private monthFormat: string,
		private language: string,
		private titleFormat: TitleFormat,
		private callbacks: CalendarHeaderCallbacks
	) {}

	/**
	 * Renders the header with month/year display and navigation buttons.
	 */
	render(currentDate: Date): void {
		const header = this.container.createDiv({ cls: "calendarz-header" });
		const current = dayjs(currentDate);

		// Month/Year display
		const monthYearContainer = header.createDiv({ cls: "calendarz-month-year" });
		const yearText = current.year().toString();
		const monthText = this.formatMonth(currentDate);

		const [firstText, secondText] = this.titleFormat === "yearMonth" 
			? [yearText, monthText] 
			: [monthText, yearText];

		monthYearContainer.createEl("span", { cls: "calendarz-month", text: firstText });
		monthYearContainer.createEl("span", { cls: "calendarz-year", text: secondText });

		// Navigation buttons
		const prevBtn = header.createEl("button", { cls: "calendarz-nav-btn" });
		prevBtn.appendChild(this.createSvgIcon("prev"));
		prevBtn.addEventListener("click", () => this.callbacks.onPrevMonth());

		const todayBtn = header.createEl("button", { 
			cls: "calendarz-today-btn", 
			text: this.i18n.calendar.today 
		});
		todayBtn.addEventListener("click", () => this.callbacks.onToday());

		const nextBtn = header.createEl("button", { cls: "calendarz-nav-btn" });
		nextBtn.appendChild(this.createSvgIcon("next"));
		nextBtn.addEventListener("click", () => this.callbacks.onNextMonth());
	}

	/**
	 * Formats the month display based on language and format preferences.
	 */
	private formatMonth(date: Date): string {
		if (this.language === "zh-CN" && this.monthFormat === "numeric") {
			return (dayjs(date).month() + 1).toString();
		}
		return dayjs(date).toDate().toLocaleString(this.language, { 
			month: this.monthFormat as "numeric" | "short" | "long" | undefined 
		});
	}

	/**
	 * Creates an SVG arrow icon for navigation buttons.
	 */
	private createSvgIcon(direction: "prev" | "next"): SVGSVGElement {
		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute("viewBox", "0 0 24 24");
		svg.setAttribute("width", "16");
		svg.setAttribute("height", "16");
		svg.setAttribute("fill", "none");
		svg.setAttribute("stroke", "currentColor");
		svg.setAttribute("stroke-width", "2");

		const points = direction === "prev" ? "15 18 9 12 15 6" : "9 18 15 12 9 6";
		const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
		polyline.setAttribute("points", points);
		svg.appendChild(polyline);

		return svg;
	}
}
