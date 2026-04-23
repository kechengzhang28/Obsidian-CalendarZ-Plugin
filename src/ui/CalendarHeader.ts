import dayjs from "dayjs";
import { I18n } from "../i18n";
import { TitleFormat } from "../settings/index";
import { IconButton } from "./components/Button";
import { formatMonth } from "../utils/date";

export interface CalendarHeaderCallbacks {
	onPrevMonth: () => void;
	onNextMonth: () => void;
	onToday: () => void;
}

/**
 * Renders the calendar header with month/year display and navigation buttons.
 */
export class CalendarHeader {
	private prevBtn: IconButton | null = null;
	private nextBtn: IconButton | null = null;

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
		const monthText = formatMonth(currentDate, this.language, this.monthFormat as "numeric" | "short" | "long");

		const [firstText, secondText] = this.titleFormat === "yearMonth"
			? [yearText, monthText]
			: [monthText, yearText];

		monthYearContainer.createEl("span", { cls: "calendarz-month", text: firstText });
		monthYearContainer.createEl("span", { cls: "calendarz-year", text: secondText });

		// Navigation buttons using IconButton component
		this.prevBtn = new IconButton("prev", () => this.callbacks.onPrevMonth());
		this.prevBtn.render(header);

		const todayBtn = header.createEl("button", {
			cls: "calendarz-today-btn",
			text: this.i18n.calendar.today,
		});
		todayBtn.addEventListener("click", () => this.callbacks.onToday());

		this.nextBtn = new IconButton("next", () => this.callbacks.onNextMonth());
		this.nextBtn.render(header);
	}

	/**
	 * Cleans up resources
	 */
	dispose(): void {
		this.prevBtn?.dispose();
		this.nextBtn?.dispose();
	}
}
