import {App, ItemView, WorkspaceLeaf} from "obsidian";
import {I18n} from "./i18n";
import {CalendarHeader} from "./ui/CalendarHeader";
import {WeekdaysRow} from "./ui/WeekdaysRow";
import {DaysGrid} from "./ui/DaysGrid";
import {HeatMap, DateCount} from "./ui/HeatMap";
import {TitleFormat, WeekStart} from "./settings";
import {getNotesCountByYamlDate} from "./utils/GetNotes";

export const CALENDARZ_VIEW_TYPE = "calendarz-view";

export class CalendarZView extends ItemView {
	private currentDate: Date = new Date();
	private selectedDate: Date = new Date();
	private i18n: I18n;
	private monthFormat: string;
	private language: string;
	private titleFormat: TitleFormat;
	private weekStart: WeekStart;
	private dateFieldName: string;
	private ignoredFolders: string[];

	constructor(
		leaf: WorkspaceLeaf,
		i18n: I18n,
		monthFormat: string = "numeric",
		language: string = "en-US",
		titleFormat: TitleFormat = "monthYear",
		weekStart: WeekStart = "sunday",
		dateFieldName: string = "date",
		ignoredFolders: string[] = []
	) {
		super(leaf);
		this.i18n = i18n;
		this.monthFormat = monthFormat;
		this.language = language;
		this.titleFormat = titleFormat;
		this.weekStart = weekStart;
		this.dateFieldName = dateFieldName;
		this.ignoredFolders = ignoredFolders;
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

	setTitleFormat(titleFormat: TitleFormat): void {
		this.titleFormat = titleFormat;
	}

	setWeekStart(weekStart: WeekStart): void {
		this.weekStart = weekStart;
	}

	setDateFieldName(dateFieldName: string): void {
		this.dateFieldName = dateFieldName;
	}

	setIgnoredFolders(ignoredFolders: string[]): void {
		this.ignoredFolders = ignoredFolders;
	}

	async onOpen(): Promise<void> {
		this.renderCalendar();
	}

	async onClose(): Promise<void> {
		this.contentEl.empty();
	}

	refresh(): void {
		void this.renderCalendar();
	}

	private async renderCalendar(): Promise<void> {
		this.contentEl.empty();
		this.contentEl.addClass("calendarz-container");

		const header = new CalendarHeader(
			this.contentEl,
			this.i18n,
			this.monthFormat,
			this.language,
			this.titleFormat,
			{
				onPrevMonth: () => {
					this.currentDate.setMonth(this.currentDate.getMonth() - 1);
					void this.renderCalendar();
				},
				onNextMonth: () => {
					this.currentDate.setMonth(this.currentDate.getMonth() + 1);
					void this.renderCalendar();
				},
				onToday: () => {
					this.currentDate = new Date();
					this.selectedDate = new Date();
					void this.renderCalendar();
				}
			}
		);
		header.render(this.currentDate);

		const weekdaysRow = new WeekdaysRow(this.contentEl, this.i18n, this.weekStart);
		weekdaysRow.render();

		const daysGrid = new DaysGrid(this.contentEl, this.weekStart, {
			onDateSelect: (date: Date) => {
				this.onDateSelected(date);
			}
		});
		daysGrid.render(this.currentDate);

		const heatMap = new HeatMap(this.contentEl, this.weekStart);
		const dateCounts = await this.getDateCounts();
		heatMap.render(this.currentDate, dateCounts);
	}

	private onDateSelected(date: Date): void {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		const dateStr = `${year}-${month}-${day}`;
	}

	private async getDateCounts(): Promise<DateCount[]> {
		return await getNotesCountByYamlDate(this.app, this.ignoredFolders, this.dateFieldName);
	}
}
