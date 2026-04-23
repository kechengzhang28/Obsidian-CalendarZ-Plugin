import dayjs from "dayjs";
import { I18n } from "../i18n";
import { TitleFormat, MonthFormat } from "../settings/index";
import { Component } from "../core/Component";
import { IconButton } from "./components/Button";
import { formatMonth } from "../utils/date";

export interface CalendarHeaderCallbacks {
	onPrevMonth: () => void;
	onNextMonth: () => void;
	onToday: () => void;
}

/**
 * Configuration options for CalendarHeader component
 */
export interface CalendarHeaderConfig {
	/** i18n strings */
	i18n: I18n;
	/** Month format (numeric, short, long) */
	monthFormat: MonthFormat;
	/** Language code */
	language: string;
	/** Title format (yearMonth or monthYear) */
	titleFormat: TitleFormat;
	/** Callback functions for navigation */
	callbacks: CalendarHeaderCallbacks;
	/** Initial date to display */
	initialDate: Date;
}

/**
 * Renders the calendar header with month/year display and navigation buttons.
 * Now extends Component base class for consistent lifecycle management.
 */
export class CalendarHeader extends Component {
	/** Header element */
	private headerEl: HTMLElement | null = null;
	/** Today button element */
	private todayBtnEl: HTMLButtonElement | null = null;
	/** Previous month button component */
	private prevBtn: IconButton | null = null;
	/** Next month button component */
	private nextBtn: IconButton | null = null;
	/** Current displayed date */
	private currentDate: Date;

	/**
	 * Creates a new CalendarHeader
	 * @param config - Header configuration
	 */
	constructor(private config: CalendarHeaderConfig) {
		super();
		this.currentDate = config.initialDate;
	}

	/**
	 * Renders the header with month/year display and navigation buttons.
	 * @param container - Parent element to render into
	 */
	render(container: HTMLElement): void {
		this.headerEl = container.createDiv({ cls: "calendarz-header" });

		const monthYearContainer = this.headerEl.createDiv({ cls: "calendarz-month-year" });
		this.renderMonthYear(monthYearContainer);

		// Navigation buttons using IconButton component
		this.prevBtn = new IconButton("prev", () => this.config.callbacks.onPrevMonth());
		this.prevBtn.render(this.headerEl);
		this.disposables.add(this.prevBtn);

		this.todayBtnEl = this.headerEl.createEl("button", {
			cls: "calendarz-today-btn",
			text: this.config.i18n.calendar.today,
		});
		this.todayBtnEl.addEventListener("click", this.config.callbacks.onToday);
		this.disposables.addCallback(() => {
			this.todayBtnEl?.removeEventListener("click", this.config.callbacks.onToday);
		});

		this.nextBtn = new IconButton("next", () => this.config.callbacks.onNextMonth());
		this.nextBtn.render(this.headerEl);
		this.disposables.add(this.nextBtn);

		this.container = this.headerEl;
		this.isRendered = true;
	}

	/**
	 * Updates the header display with a new date
	 * @param currentDate - New date to display
	 */
	update(currentDate: Date): void {
		if (!this.headerEl) return;

		this.currentDate = currentDate;

		const monthYearContainer = this.headerEl.querySelector(".calendarz-month-year");
		if (monthYearContainer) {
			monthYearContainer.empty();
			this.renderMonthYear(monthYearContainer as HTMLElement);
		}
	}

	/**
	 * Renders month/year text into the given container
	 * @param container - Element to render into
	 */
	private renderMonthYear(container: HTMLElement): void {
		const current = dayjs(this.currentDate);
		const yearText = current.year().toString();
		const monthText = formatMonth(
			this.currentDate,
			this.config.language,
			this.config.monthFormat
		);

		const [firstText, secondText] = this.config.titleFormat === "yearMonth"
			? [yearText, monthText]
			: [monthText, yearText];

		container.createEl("span", { cls: "calendarz-month", text: firstText });
		container.createEl("span", { cls: "calendarz-year", text: secondText });
	}
}
