import { ItemView, WorkspaceLeaf, TFile, Notice } from "obsidian";
import dayjs from "dayjs";
import { I18n } from "./i18n";
import { CalendarHeader } from "./ui/CalendarHeader";
import { WeekdaysRow } from "./ui/WeekdaysRow";
import { DaysGrid, DateCount } from "./ui/DaysGrid";
import { ConfirmModal } from "./ui/ConfirmModal";
import { TitleFormat, WeekStart, DateSource, DisplayMode } from "./settings/index";
import { getNotesCountByYamlDate, getNotesCountByFilenameDate } from "./utils/GetNotes";
import { formatDate, isSameDay, getYearMonth } from "./utils/dateUtils";
import { createDailyNote, findDailyNote } from "./utils/createNote";
import { CSS_CLASSES } from "./constants";
import CalendarZ from "./main";

/** Unique identifier for the CalendarZ view type */
export const CALENDARZ_VIEW_TYPE = "calendarz-view";

/** Settings interface for CalendarZViewView constructor */
export interface CalendarZViewSettings {
	monthFormat: string;
	language: string;
	titleFormat: TitleFormat;
	weekStart: WeekStart;
	dateFieldName: string;
	ignoredFolders: string[];
	dateSource: DateSource;
	filenameDateFormat: string;
	displayMode: DisplayMode;
	dotThreshold: number;
	confirmBeforeCreate: boolean;
}

/** Default settings for CalendarZView */
const DEFAULT_VIEW_SETTINGS: CalendarZViewSettings = {
	monthFormat: "numeric",
	language: "en-US",
	titleFormat: "monthYear",
	weekStart: "sunday",
	dateFieldName: "date",
	ignoredFolders: [],
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
	private selectedDate: Date = new Date();
	private i18n: I18n;
	private settings: CalendarZViewSettings;
	private plugin: CalendarZ;

	/**
	 * Creates a new CalendarZView instance.
	 * @param leaf - Obsidian workspace leaf
	 * @param i18n - Internationalization strings
	 * @param settings - Partial view settings (defaults applied for missing values)
	 * @param plugin - CalendarZ plugin instance
	 */
	constructor(leaf: WorkspaceLeaf, i18n: I18n, settings: Partial<CalendarZViewSettings> = {}, plugin: CalendarZ) {
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

	// Settings update methods
	setI18n(i18n: I18n): void {
		this.i18n = i18n;
	}

	setMonthFormat(monthFormat: string): void {
		this.settings.monthFormat = monthFormat;
	}

	setLanguage(language: string): void {
		this.settings.language = language;
	}

	setTitleFormat(titleFormat: TitleFormat): void {
		this.settings.titleFormat = titleFormat;
	}

	setWeekStart(weekStart: WeekStart): void {
		this.settings.weekStart = weekStart;
	}

	setDateFieldName(dateFieldName: string): void {
		this.settings.dateFieldName = dateFieldName;
	}

	setIgnoredFolders(ignoredFolders: string[]): void {
		this.settings.ignoredFolders = ignoredFolders;
	}

	setDateSource(dateSource: DateSource): void {
		this.settings.dateSource = dateSource;
	}

	setFilenameDateFormat(filenameDateFormat: string): void {
		this.settings.filenameDateFormat = filenameDateFormat;
	}

	setDisplayMode(displayMode: DisplayMode): void {
		this.settings.displayMode = displayMode;
	}

	setDotThreshold(dotThreshold: number): void {
		this.settings.dotThreshold = dotThreshold;
	}

	setConfirmBeforeCreate(confirmBeforeCreate: boolean): void {
		this.settings.confirmBeforeCreate = confirmBeforeCreate;
	}

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
	 * Delegates to DaysGrid for actual DOM updates.
	 */
	async refreshStatsOnly(): Promise<void> {
		if (this.settings.displayMode === "none") return;

		const dateCounts = await this.fetchDateCounts();
		const dateCountsMap = this.buildDateCountsMap(dateCounts);

		const daysGrid = this.contentEl.querySelector(`.${CSS_CLASSES.DAYS}`);
		if (!daysGrid) return;

		this.updateDayElementsStats(daysGrid as HTMLElement, dateCountsMap);
	}

	/**
	 * Updates statistics on existing day elements.
	 */
	private updateDayElementsStats(daysGrid: HTMLElement, dateCountsMap: Map<string, number>): void {
		const { year, month } = getYearMonth(this.currentDate);
		const maxCount = this.calculateMaxCount(dateCountsMap);
		const today = dayjs();

		const dayElements = daysGrid.querySelectorAll(`.${CSS_CLASSES.DAY}:not(.${CSS_CLASSES.DAY_OTHER_MONTH})`);

		dayElements.forEach((dayEl) => {
			const day = this.parseDayNumber(dayEl.textContent);
			if (day === null) return;

			const date = dayjs(new Date(year, month, day));
			const dateStr = formatDate(date);
			const count = dateCountsMap.get(dateStr) || 0;

			this.clearDayStats(dayEl as HTMLElement);
			this.applyDayStats(dayEl as HTMLElement, date, dateStr, count, maxCount, today);
		});
	}

	/**
	 * Parses day number from element text content.
	 */
	private parseDayNumber(text: string | null): number | null {
		if (!text) return null;
		const day = parseInt(text, 10);
		return isNaN(day) ? null : day;
	}

	/**
	 * Clears existing statistics from a day element.
	 */
	private clearDayStats(dayEl: HTMLElement): void {
		dayEl.removeClass(CSS_CLASSES.DAY_HEATMAP);
		dayEl.style.removeProperty("--heatmap-opacity");
		dayEl.removeAttribute("data-count");
		dayEl.removeAttribute("aria-label");

		const existingDots = dayEl.querySelector(`.${CSS_CLASSES.DOTS_CONTAINER}`);
		if (existingDots) {
			existingDots.remove();
		}
	}

	/**
	 * Applies statistics styling to a day element.
	 */
	private applyDayStats(
		dayEl: HTMLElement,
		date: dayjs.Dayjs,
		dateStr: string,
		count: number,
		maxCount: number,
		today: dayjs.Dayjs
	): void {
		const isTodayDate = isSameDay(date, today);
		const isBeforeToday = date.isBefore(today, "day");

		if (this.settings.displayMode === "heatmap" && count > 0) {
			this.applyHeatmapStyle(dayEl, count, maxCount, dateStr);
		}

		if (this.settings.displayMode === "dots") {
			this.renderDots(dayEl, count, isTodayDate, isBeforeToday);
			if (count > 0 || isBeforeToday) {
				dayEl.setAttribute("aria-label", `${dateStr}: ${count} notes`);
			}
		}
	}

	/**
	 * Applies heatmap styling to a day element.
	 */
	private applyHeatmapStyle(dayEl: HTMLElement, count: number, maxCount: number, dateStr: string): void {
		dayEl.addClass(CSS_CLASSES.DAY_HEATMAP);
		const intensity = maxCount > 0 ? count / maxCount : 0;
		const opacity = 0.25 + intensity * 0.75;
		dayEl.style.setProperty("--heatmap-opacity", opacity.toFixed(2));
		dayEl.setAttribute("data-count", count.toString());
		dayEl.setAttribute("aria-label", `${dateStr}: ${count} notes`);
	}

	/**
	 * Renders dots below the date to represent note count.
	 */
	private renderDots(dayEl: HTMLElement, count: number, isToday: boolean, isBeforeToday: boolean): void {
		const dotsContainer = dayEl.createDiv({ cls: CSS_CLASSES.DOTS_CONTAINER });

		if (count > 0) {
			const numDots = Math.min(4, Math.ceil(count / this.settings.dotThreshold));
			for (let i = 0; i < numDots; i++) {
				dotsContainer.createDiv({ cls: CSS_CLASSES.DOT });
			}
		} else if (isBeforeToday) {
			dotsContainer.createDiv({ cls: `${CSS_CLASSES.DOT} ${CSS_CLASSES.DOT_GRAY}` });
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
			await this.renderCalendar();
			return;
		}

		const daysGrid = this.contentEl.querySelector(`.${CSS_CLASSES.DAYS}`);
		if (!daysGrid) return;

		const todayDay = today.date();
		const dayElements = daysGrid.querySelectorAll(`.${CSS_CLASSES.DAY}:not(.${CSS_CLASSES.DAY_OTHER_MONTH})`);

		dayElements.forEach((dayEl) => {
			const day = this.parseDayNumber(dayEl.textContent);
			if (day === null) return;

			if (day === todayDay) {
				dayEl.addClass(CSS_CLASSES.DAY_TODAY);
			} else {
				dayEl.removeClass(CSS_CLASSES.DAY_TODAY);
			}
		});
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
		this.selectedDate = new Date();
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
			(date) => this.handleDayClick(date)
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
					async () => {
						await this.createDailyNote(date);
					},
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

	/**
	 * Builds a map from date counts array for efficient lookup.
	 */
	private buildDateCountsMap(dateCounts: DateCount[]): Map<string, number> {
		const map = new Map<string, number>();
		for (const item of dateCounts) {
			map.set(item.date, item.count);
		}
		return map;
	}

	/**
	 * Calculates the maximum count from date counts map.
	 */
	private calculateMaxCount(dateCountsMap: Map<string, number>): number {
		let max = 0;
		for (const count of dateCountsMap.values()) {
			if (count > max) max = count;
		}
		return max;
	}
}
