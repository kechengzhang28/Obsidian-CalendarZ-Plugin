import {ItemView, WorkspaceLeaf} from "obsidian";
import {I18n} from "./i18n";

export const CALENDARZ_VIEW_TYPE = "calendarz-view";

export class CalendarZView extends ItemView {
	private currentDate: Date = new Date();
	private selectedDate: Date = new Date();
	private i18n: I18n;
	private monthFormat: string;
	private language: string;

	constructor(leaf: WorkspaceLeaf, i18n: I18n, monthFormat: string = "numeric", language: string = "en-US") {
		super(leaf);
		this.i18n = i18n;
		this.monthFormat = monthFormat;
		this.language = language;
	}

	getViewType(): string {
		return CALENDARZ_VIEW_TYPE;
	}

	getDisplayText(): string {
		return this.i18n.calendar.viewTitle;
	}

	getIcon(): string {
		return "calendar";
	}

	setI18n(i18n: I18n): void {
		this.i18n = i18n;
	}

	setMonthFormat(monthFormat: string): void {
		this.monthFormat = monthFormat;
	}

	setLanguage(language: string): void {
		this.language = language;
	}

	async onOpen(): Promise<void> {
		this.renderCalendar();
	}

	async onClose(): Promise<void> {
		this.contentEl.empty();
	}

	refresh(): void {
		this.renderCalendar();
	}

	private renderCalendar(): void {
		this.contentEl.empty();
		this.contentEl.addClass("calendarz-container");

		// Create header with month/year display and navigation buttons
		const header = this.contentEl.createDiv({ cls: "calendarz-header" });

		const monthYearContainer = header.createDiv({ cls: "calendarz-month-year" });
		const monthText = monthYearContainer.createEl("span", { cls: "calendarz-month" });
		monthText.textContent = this.formatMonth(this.currentDate);
		const yearText = monthYearContainer.createEl("span", { cls: "calendarz-year" });
		yearText.textContent = this.currentDate.getFullYear().toString();

		// Previous month button
		const prevBtn = header.createEl("button", { cls: "calendarz-nav-btn" });
		prevBtn.innerHTML = "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='15 18 9 12 15 6'></polyline></svg>";
		prevBtn.addEventListener("click", () => {
			this.currentDate.setMonth(this.currentDate.getMonth() - 1);
			this.renderCalendar();
		});

		// "Today" button to jump back to current month
		const todayBtn = header.createEl("button", { cls: "calendarz-today-btn", text: `${this.i18n.calendar.today}` });
		todayBtn.addEventListener("click", () => {
			this.currentDate = new Date();
			this.selectedDate = new Date();
			this.renderCalendar();
		});

		// Next month button
		const nextBtn = header.createEl("button", { cls: "calendarz-nav-btn" });
		nextBtn.innerHTML = "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='9 18 15 12 9 6'></polyline></svg>";
		nextBtn.addEventListener("click", () => {
			this.currentDate.setMonth(this.currentDate.getMonth() + 1);
			this.renderCalendar();
		});

		// Weekday headers row
		const weekdayRow = this.contentEl.createDiv({ cls: "calendarz-weekdays" });
		this.i18n.calendar.weekdays.forEach((day: string) => {
			weekdayRow.createEl("span", { cls: "calendarz-weekday", text: day });
		});

		// Grid container for day cells
		const daysGrid = this.contentEl.createDiv({ cls: "calendarz-days" });

		const year = this.currentDate.getFullYear();
		const month = this.currentDate.getMonth();

		// Get calendar data for the current month view
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const daysInMonth = lastDay.getDate();
		const startingDayOfWeek = firstDay.getDay();

		const today = new Date();

		// Fill in days from the previous month to complete the first week
		const prevMonthLastDay = new Date(year, month, 0).getDate();
		for (let i = startingDayOfWeek - 1; i >= 0; i--) {
			const prevDay = prevMonthLastDay - i;
			const dayEl = daysGrid.createDiv({ cls: "calendarz-day calendarz-day-other-month" });
			dayEl.textContent = prevDay.toString();
		}

		// Render days of the current month
		for (let day = 1; day <= daysInMonth; day++) {
			const date = new Date(year, month, day);
			const dayEl = daysGrid.createDiv({ cls: "calendarz-day" });
			dayEl.textContent = day.toString();

			// Highlight today's date
			if (this.isSameDate(date, today)) {
				dayEl.addClass("calendarz-day-today");
			}

			// Highlight selected date
			if (this.isSameDate(date, this.selectedDate)) {
				dayEl.addClass("calendarz-day-selected");
			}

			// Handle date selection on click
			dayEl.addEventListener("click", () => {
				this.selectedDate = date;
				this.renderCalendar();
				this.onDateSelected(date);
			});
		}

		// Fill in days from the next month to complete a 6-row grid (42 cells total)
		const totalCells = 42; // 6 rows x 7 columns
		const currentCells = startingDayOfWeek + daysInMonth;
		const nextMonthDays = totalCells - currentCells;

		for (let day = 1; day <= nextMonthDays; day++) {
			const dayEl = daysGrid.createDiv({ cls: "calendarz-day calendarz-day-other-month" });
			dayEl.textContent = day.toString();
		}
	}

	// Format month display based on language and format preference
	private formatMonth(date: Date): string {
		if (this.language === "zh-CN" && this.monthFormat === "numeric") {
			return (date.getMonth() + 1).toString();
		}
		return date.toLocaleString(this.language, { month: this.monthFormat as any });
	}

	// Check if two dates represent the same day
	private isSameDate(date1: Date, date2: Date): boolean {
		return date1.getFullYear() === date2.getFullYear() &&
			date1.getMonth() === date2.getMonth() &&
			date1.getDate() === date2.getDate();
	}

	// Handle date selection event - currently formats date string (hook for future use)
	private onDateSelected(date: Date): void {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		const dateStr = `${year}-${month}-${day}`;
	}
}
