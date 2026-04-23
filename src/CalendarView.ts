import {ItemView, WorkspaceLeaf} from "obsidian";
import dayjs from "dayjs";
import {I18n} from "./i18n";
import {CalendarHeader} from "./ui/CalendarHeader";
import {WeekdaysRow} from "./ui/WeekdaysRow";
import {DaysGrid, DateCount} from "./ui/DaysGrid";
import {TitleFormat, WeekStart, DateSource} from "./settings";
import {getNotesCountByYamlDate, getNotesCountByFilenameDate} from "./utils/GetNotes";

/** Unique identifier for the CalendarZ view type */
export const CALENDARZ_VIEW_TYPE = "calendarz-view";

/**
 * Main calendar view component for the CalendarZ plugin.
 * Renders a monthly calendar with optional heatmap visualization of note activity.
 */
export class CalendarZView extends ItemView {
	/** Currently displayed month */
	private currentDate: Date = new Date();
	/** User-selected date */
	private selectedDate: Date = new Date();
	/** Internationalization strings */
	private i18n: I18n;
	/** Month display format preference */
	private monthFormat: string;
	/** Display language locale */
	private language: string;
	/** Title format preference (yearMonth or monthYear) */
	private titleFormat: TitleFormat;
	/** Week start preference (sunday or monday) */
	private weekStart: WeekStart;
	/** YAML field name for date extraction */
	private dateFieldName: string;
	/** List of folder paths to ignore */
	private ignoredFolders: string[];
	/** Source of date data (yaml or filename) */
	private dateSource: DateSource;
	/** Date format pattern for filename extraction */
	private filenameDateFormat: string;
	/** Whether to show heatmap on date cells */
	private showHeatmap: boolean;

	/**
	 * Creates a new CalendarZView instance.
	 * @param leaf - Obsidian workspace leaf
	 * @param i18n - Internationalization strings
	 * @param monthFormat - Month display format
	 * @param language - Display language
	 * @param titleFormat - Title format preference
	 * @param weekStart - Week start day preference
	 * @param dateFieldName - YAML field name for dates
	 * @param ignoredFolders - Folders to exclude
	 * @param dateSource - Source of date data
	 * @param filenameDateFormat - Filename date format pattern
	 * @param showHeatmap - Whether to show heatmap visualization
	 */
	constructor(
		leaf: WorkspaceLeaf,
		i18n: I18n,
		monthFormat: string = "numeric",
		language: string = "en-US",
		titleFormat: TitleFormat = "monthYear",
		weekStart: WeekStart = "sunday",
		dateFieldName: string = "date",
		ignoredFolders: string[] = [],
		dateSource: DateSource = "yaml",
		filenameDateFormat: string = "YYYY-MM-DD",
		showHeatmap: boolean = true
	) {
		super(leaf);
		this.i18n = i18n;
		this.monthFormat = monthFormat;
		this.language = language;
		this.titleFormat = titleFormat;
		this.weekStart = weekStart;
		this.dateFieldName = dateFieldName;
		this.ignoredFolders = ignoredFolders;
		this.dateSource = dateSource;
		this.filenameDateFormat = filenameDateFormat;
		this.showHeatmap = showHeatmap;
	}

	/** Returns the unique view type identifier */
	getViewType(): string {
		return CALENDARZ_VIEW_TYPE;
	}

	/** Returns the display text for the view tab */
	getDisplayText(): string {
		return this.i18n.calendar.viewTitle;
	}

	/** Returns the icon name for the view */
	getIcon(): string {
		return "calendar";
	}

	/** Updates the i18n instance */
	setI18n(i18n: I18n): void {
		this.i18n = i18n;
	}

	/** Updates the month format setting */
	setMonthFormat(monthFormat: string): void {
		this.monthFormat = monthFormat;
	}

	/** Updates the display language */
	setLanguage(language: string): void {
		this.language = language;
	}

	/** Updates the title format setting */
	setTitleFormat(titleFormat: TitleFormat): void {
		this.titleFormat = titleFormat;
	}

	/** Updates the week start setting */
	setWeekStart(weekStart: WeekStart): void {
		this.weekStart = weekStart;
	}

	/** Updates the YAML date field name */
	setDateFieldName(dateFieldName: string): void {
		this.dateFieldName = dateFieldName;
	}

	/** Updates the ignored folders list */
	setIgnoredFolders(ignoredFolders: string[]): void {
		this.ignoredFolders = ignoredFolders;
	}

	/** Updates the date source setting */
	setDateSource(dateSource: DateSource): void {
		this.dateSource = dateSource;
	}

	/** Updates the filename date format pattern */
	setFilenameDateFormat(filenameDateFormat: string): void {
		this.filenameDateFormat = filenameDateFormat;
	}

	/** Updates the show heatmap setting */
	setShowHeatmap(showHeatmap: boolean): void {
		this.showHeatmap = showHeatmap;
	}

	/** Called when the view is opened */
	async onOpen(): Promise<void> {
		await this.renderCalendar();
	}

	/** Called when the view is closed */
	async onClose(): Promise<void> {
		this.contentEl.empty();
	}

	/** Refreshes the calendar display */
	refresh(): void {
		void this.renderCalendar();
	}

	/**
	 * Renders the complete calendar UI.
	 * Creates header, weekdays row, and days grid with optional heatmap.
	 */
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
					this.currentDate = dayjs(this.currentDate).subtract(1, "month").toDate();
					void this.renderCalendar();
				},
				onNextMonth: () => {
					this.currentDate = dayjs(this.currentDate).add(1, "month").toDate();
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

		// Get date counts for heatmap if enabled
		let dateCounts: DateCount[] = [];
		if (this.showHeatmap) {
			dateCounts = await this.getDateCounts();
		}

		const daysGrid = new DaysGrid(this.contentEl, this.weekStart, this.showHeatmap);
		daysGrid.render(this.currentDate, dateCounts);
	}

	/**
	 * Retrieves date counts based on the configured date source.
	 * @returns Array of date counts for the heatmap
	 */
	private async getDateCounts(): Promise<DateCount[]> {
		switch (this.dateSource) {
			case "yaml":
				return await getNotesCountByYamlDate(this.app, this.ignoredFolders, this.dateFieldName);
			case "filename":
				return await getNotesCountByFilenameDate(this.app, this.ignoredFolders, this.filenameDateFormat);
			default:
				return await getNotesCountByYamlDate(this.app, this.ignoredFolders, this.dateFieldName);
		}
	}
}
