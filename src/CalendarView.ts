import {ItemView, WorkspaceLeaf} from "obsidian";

export const CALENDARZ_VIEW_TYPE = "calendarz-view";

export class CalendarZView extends ItemView {
	private currentDate: Date = new Date();
	private selectedDate: Date = new Date();

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return CALENDARZ_VIEW_TYPE;
	}

	getDisplayText(): string {
		return "CalendarZ";
	}

	getIcon(): string {
		return "calendar";
	}

	async onOpen(): Promise<void> {
		this.renderCalendar();
	}

	async onClose(): Promise<void> {
		this.contentEl.empty();
	}

	private renderCalendar(): void {
		this.contentEl.empty();
		this.contentEl.addClass("calendarz-container");

		const header = this.contentEl.createDiv({ cls: "calendarz-header" });

		const prevBtn = header.createEl("button", { cls: "calendarz-nav-btn", text: "‹" });
		prevBtn.addEventListener("click", () => {
			this.currentDate.setMonth(this.currentDate.getMonth() - 1);
			this.renderCalendar();
		});

		const monthYearText = header.createEl("span", { cls: "calendarz-month-year" });
		monthYearText.textContent = this.formatMonthYear(this.currentDate);

		const nextBtn = header.createEl("button", { cls: "calendarz-nav-btn", text: "›" });
		nextBtn.addEventListener("click", () => {
			this.currentDate.setMonth(this.currentDate.getMonth() + 1);
			this.renderCalendar();
		});

		const todayBtn = header.createEl("button", { cls: "calendarz-today-btn", text: "Today" });
		todayBtn.addEventListener("click", () => {
			this.currentDate = new Date();
			this.selectedDate = new Date();
			this.renderCalendar();
		});

		const weekdayRow = this.contentEl.createDiv({ cls: "calendarz-weekdays" });
		const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
		weekdays.forEach(day => {
			weekdayRow.createEl("span", { cls: "calendarz-weekday", text: day });
		});

		const daysGrid = this.contentEl.createDiv({ cls: "calendarz-days" });

		const year = this.currentDate.getFullYear();
		const month = this.currentDate.getMonth();

		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const daysInMonth = lastDay.getDate();
		const startingDayOfWeek = firstDay.getDay();

		const today = new Date();

		for (let i = 0; i < startingDayOfWeek; i++) {
			daysGrid.createDiv({ cls: "calendarz-day calendarz-day-empty" });
		}

		for (let day = 1; day <= daysInMonth; day++) {
			const date = new Date(year, month, day);
			const dayEl = daysGrid.createDiv({ cls: "calendarz-day" });
			dayEl.textContent = day.toString();

			if (this.isSameDate(date, today)) {
				dayEl.addClass("calendarz-day-today");
			}

			if (this.isSameDate(date, this.selectedDate)) {
				dayEl.addClass("calendarz-day-selected");
			}

			dayEl.addEventListener("click", () => {
				this.selectedDate = date;
				this.renderCalendar();
				this.onDateSelected(date);
			});
		}
	}

	private formatMonthYear(date: Date): string {
		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		return `${year}-${month}`;
	}

	private isSameDate(date1: Date, date2: Date): boolean {
		return date1.getFullYear() === date2.getFullYear() &&
			date1.getMonth() === date2.getMonth() &&
			date1.getDate() === date2.getDate();
	}

	private onDateSelected(date: Date): void {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		const dateStr = `${year}-${month}-${day}`;
	}
}
