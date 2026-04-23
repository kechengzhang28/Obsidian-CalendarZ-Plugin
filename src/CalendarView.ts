import { ItemView, WorkspaceLeaf } from "obsidian";
import dayjs from "dayjs";
import { I18n } from "./i18n";
import { CalendarHeader } from "./ui/CalendarHeader";
import { WeekdaysRow } from "./ui/WeekdaysRow";
import { DaysGrid, DateCount } from "./ui/DaysGrid";
import { ConfirmModal } from "./ui/ConfirmModal";
import { CalendarZSettings } from "./settings/index";
import { getNotesCountByYamlDate, getNotesCountByFilenameDate } from "./utils/GetNotes";
import { createDailyNote, findDailyNote } from "./utils/createNote";
import { CSS_CLASSES } from "./constants";
import CalendarZ from "./main";

export const CALENDARZ_VIEW_TYPE = "calendarz-view";

const DEFAULT_VIEW_SETTINGS: CalendarZSettings = {
	language: "en-US",
	monthFormat: "numeric",
	titleFormat: "monthYear",
	weekStart: "sunday",
	ignoredFolders: [],
	dateFieldName: "date",
	dateSource: "yaml",
	filenameDateFormat: "YYYY-MM-DD",
	displayMode: "heatmap",
	dotThreshold: 1,
	confirmBeforeCreate: true,
};

/**
 * Main calendar view component for the CalendarZ plugin.
 * Renders a monthly calendar with optional heatmap visualization of note activity.
 */
export class CalendarZView extends ItemView {
	private currentDate: Date = new Date();
	private i18n: I18n;
	private settings: CalendarZSettings;
	private plugin: CalendarZ;

	constructor(leaf: WorkspaceLeaf, i18n: I18n, settings: Partial<CalendarZSettings> = {}, plugin: CalendarZ) {
		super(leaf);
		this.i18n = i18n;
		this.settings = { ...DEFAULT_VIEW_SETTINGS, ...settings };
		this.plugin = plugin;
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

	setI18n(i18n: I18n): void { this.i18n = i18n; }
	setMonthFormat(v: CalendarZSettings['monthFormat']): void { this.settings.monthFormat = v; }
	setLanguage(v: CalendarZSettings['language']): void { this.settings.language = v; }
	setTitleFormat(v: CalendarZSettings['titleFormat']): void { this.settings.titleFormat = v; }
	setWeekStart(v: CalendarZSettings['weekStart']): void { this.settings.weekStart = v; }
	setDateFieldName(v: string): void { this.settings.dateFieldName = v; }
	setIgnoredFolders(v: string[]): void { this.settings.ignoredFolders = v; }
	setDateSource(v: CalendarZSettings['dateSource']): void { this.settings.dateSource = v; }
	setFilenameDateFormat(v: string): void { this.settings.filenameDateFormat = v; }
	setDisplayMode(v: CalendarZSettings['displayMode']): void { this.settings.displayMode = v; }
	setDotThreshold(v: number): void { this.settings.dotThreshold = v; }
	setConfirmBeforeCreate(v: boolean): void { this.settings.confirmBeforeCreate = v; }

	async onOpen(): Promise<void> {
		await this.renderCalendar();
	}

	async onClose(): Promise<void> {
		this.contentEl.empty();
	}

	refresh(): void {
		void this.renderCalendar();
	}

	/**
	 * Refreshes only the statistics data without re-rendering the entire calendar.
	 */
	async refreshStatsOnly(): Promise<void> {
		// 简化逻辑：直接重新渲染整个日历
		if (this.settings.displayMode !== "none") {
			void this.renderCalendar();
		}
	}





	/**
	 * Updates the "today" highlight on the calendar.
	 */
	async updateTodayHighlight(): Promise<void> {
		const today = dayjs();
		const current = dayjs(this.currentDate);

		if (today.year() !== current.year() || today.month() !== current.month()) {
			this.currentDate = new Date();
		}
		await this.renderCalendar();
	}

	/**
	 * Renders the complete calendar UI.
	 */
	private async renderCalendar(): Promise<void> {
		this.contentEl.empty();
		this.contentEl.addClass(CSS_CLASSES.CONTAINER);

		this.renderHeader();
		this.renderWeekdays();
		await this.renderDaysGrid();
	}

	/**
	 * Renders the calendar header with navigation.
	 */
	private renderHeader(): void {
		const header = new CalendarHeader(
			this.contentEl,
			this.i18n,
			this.settings.monthFormat,
			this.settings.language,
			this.settings.titleFormat,
			{
				onPrevMonth: () => this.navigateMonth(-1),
				onNextMonth: () => this.navigateMonth(1),
				onToday: () => this.goToToday(),
			}
		);
		header.render(this.currentDate);
	}

	/**
	 * Navigates to previous or next month.
	 */
	private navigateMonth(direction: -1 | 1): void {
		this.currentDate = dayjs(this.currentDate).add(direction, "month").toDate();
		void this.renderCalendar();
	}

	/**
	 * Navigates to today's date.
	 */
	private goToToday(): void {
		this.currentDate = new Date();
		void this.renderCalendar();
	}

	/**
	 * Renders the weekdays row.
	 */
	private renderWeekdays(): void {
		const weekdaysRow = new WeekdaysRow(this.contentEl, this.i18n, this.settings.weekStart);
		weekdaysRow.render();
	}

	/**
	 * Renders the days grid with statistics.
	 */
	private async renderDaysGrid(): Promise<void> {
		let dateCounts: DateCount[] = [];
		if (this.settings.displayMode !== "none") {
			dateCounts = await this.fetchDateCounts();
		}

		const daysGrid = new DaysGrid(
			this.contentEl,
			this.settings.weekStart,
			this.settings.displayMode,
			this.settings.dotThreshold,
			(date) => void this.handleDayClick(date)
		);
		daysGrid.render(this.currentDate, dateCounts);
	}

	/**
	 * Handles day click events.
	 * Opens existing daily note or creates a new one.
	 */
	private async handleDayClick(date: Date): Promise<void> {
		const dateStr = dayjs(date).format("YYYY-MM-DD");
		const existingNote = findDailyNote(date);

		if (existingNote) {
			// Open existing note
			await this.app.workspace.openLinkText(existingNote.path, "", false);
		} else {
			// Create new daily note
			if (this.settings.confirmBeforeCreate) {
				// Show confirmation modal
				new ConfirmModal(
					this.app,
					this.plugin.i18n,
					dateStr,
					() => void this.createDailyNote(date),
					() => {
						// User cancelled, do nothing
					}
				).open();
			} else {
				// Create directly without confirmation
				await this.createDailyNote(date);
			}
		}
	}



	/**
	 * Creates or opens a daily note for the given date using the core Daily Notes plugin.
	 */
	private async createDailyNote(date: Date): Promise<void> {
		await createDailyNote(this.plugin, date);
	}

	/**
	 * Fetches date counts based on the configured date source.
	 */
	private async fetchDateCounts(): Promise<DateCount[]> {
		const { dateSource, ignoredFolders, dateFieldName, filenameDateFormat } = this.settings;

		switch (dateSource) {
			case "yaml":
				return await getNotesCountByYamlDate(this.app, ignoredFolders, dateFieldName);
			case "filename":
				return await getNotesCountByFilenameDate(this.app, ignoredFolders, filenameDateFormat);
			default:
				return await getNotesCountByYamlDate(this.app, ignoredFolders, dateFieldName);
		}
	}


}
