import {ItemView, WorkspaceLeaf} from "obsidian";
import {I18n} from "./i18n";
import {CalendarHeader} from "./ui/CalendarHeader";
import {WeekdaysRow} from "./ui/WeekdaysRow";
import {DaysGrid} from "./ui/DaysGrid";

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

		const header = new CalendarHeader(
			this.contentEl,
			this.i18n,
			this.monthFormat,
			this.language,
			{
				onPrevMonth: () => {
					this.currentDate.setMonth(this.currentDate.getMonth() - 1);
					this.renderCalendar();
				},
				onNextMonth: () => {
					this.currentDate.setMonth(this.currentDate.getMonth() + 1);
					this.renderCalendar();
				},
				onToday: () => {
					this.currentDate = new Date();
					this.selectedDate = new Date();
					this.renderCalendar();
				}
			}
		);
		header.render(this.currentDate);

		const weekdaysRow = new WeekdaysRow(this.contentEl, this.i18n);
		weekdaysRow.render();

		const daysGrid = new DaysGrid(this.contentEl, {
			onDateSelect: (date: Date) => {
				this.selectedDate = date;
				this.renderCalendar();
				this.onDateSelected(date);
			}
		});
		daysGrid.render(this.currentDate, this.selectedDate);
	}

	private onDateSelected(date: Date): void {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		const dateStr = `${year}-${month}-${day}`;
	}
}
