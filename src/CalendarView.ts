import {ItemView, WorkspaceLeaf} from "obsidian";
import dayjs from "dayjs";
import {I18n} from "./i18n";
import {CalendarHeader} from "./ui/CalendarHeader";
import {WeekdaysRow} from "./ui/WeekdaysRow";
import {DaysGrid, DateCount} from "./ui/DaysGrid";
import {TitleFormat, WeekStart, DateSource, DisplayMode} from "./settings/index";
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
	/** Display mode for note statistics */
	private displayMode: DisplayMode;
	/** Number of notes each dot represents (for dots mode) */
	private dotThreshold: number;

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
	 * @param displayMode - Display mode for note statistics
	 * @param dotThreshold - Number of notes each dot represents
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
		displayMode: DisplayMode = "heatmap",
		dotThreshold: number = 1
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
		this.displayMode = displayMode;
		this.dotThreshold = dotThreshold;
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

	/** Updates the display mode setting */
	setDisplayMode(displayMode: DisplayMode): void {
		this.displayMode = displayMode;
	}

	/** Updates the dot threshold setting */
	setDotThreshold(dotThreshold: number): void {
		this.dotThreshold = dotThreshold;
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
	 * Refreshes only the statistics data without re-rendering the entire calendar.
	 * This avoids flickering when only note counts have changed.
	 */
	async refreshStatsOnly(): Promise<void> {
		if (this.displayMode === "none") return;

		const dateCounts = await this.getDateCounts();
		const dateCountsMap = new Map<string, number>();
		for (const item of dateCounts) {
			dateCountsMap.set(item.date, item.count);
		}

		// Find the days grid and update styling on each day cell
		const daysGrid = this.contentEl.querySelector(".calendarz-days");
		if (!daysGrid) return;

		const dayElements = daysGrid.querySelectorAll(".calendarz-day:not(.calendarz-day-other-month)");
		const current = dayjs(this.currentDate);
		const year = current.year();
		const month = current.month();

		// Calculate max count for normalization
		let maxCount = 0;
		for (const count of dateCountsMap.values()) {
			if (count > maxCount) maxCount = count;
		}

		const today = dayjs();

		dayElements.forEach((dayEl) => {
			const dayText = dayEl.textContent;
			if (!dayText) return;

			const day = parseInt(dayText, 10);
			if (isNaN(day)) return;

			const date = dayjs(new Date(year, month, day));
			const dateStr = date.format("YYYY-MM-DD");
			const count = dateCountsMap.get(dateStr) || 0;
			const isToday = date.isSame(today, "day");
			const isBeforeToday = date.isBefore(today, "day");

			// Remove existing heatmap classes and styles
			dayEl.removeClass("calendarz-day-heatmap");
			(dayEl as HTMLElement).style.removeProperty("--heatmap-opacity");
			dayEl.removeAttribute("data-count");
			dayEl.removeAttribute("aria-label");

			// Remove existing dots
			const existingDots = dayEl.querySelector(".calendarz-dots-container");
			if (existingDots) {
				existingDots.remove();
			}

			// Apply heatmap styling if in heatmap mode
			if (this.displayMode === "heatmap" && count > 0) {
				dayEl.addClass("calendarz-day-heatmap");
				const intensity = maxCount > 0 ? count / maxCount : 0;
				const opacity = 0.25 + intensity * 0.75;
				(dayEl as HTMLElement).style.setProperty("--heatmap-opacity", opacity.toFixed(2));
				dayEl.setAttribute("data-count", count.toString());
				dayEl.setAttribute("aria-label", `${dateStr}: ${count} notes`);
			}

			// Add dots for dots mode
			if (this.displayMode === "dots") {
				this.renderDots(dayEl as HTMLElement, count, isToday, isBeforeToday);
				if (count > 0 || isBeforeToday) {
					dayEl.setAttribute("aria-label", `${dateStr}: ${count} notes`);
				}
			}
		});
	}

	/**
	 * Renders dots below the date to represent note count.
	 * Maximum 4 dots, each representing dotThreshold notes.
	 * For dates before today: show dots if notes exist, otherwise show a gray dot.
	 * For today: show dots only if notes exist.
	 * @param dayEl - The day element to add dots to
	 * @param count - Number of notes for this date
	 * @param isToday - Whether this date is today
	 * @param isBeforeToday - Whether this date is before today
	 */
	private renderDots(dayEl: HTMLElement, count: number, isToday: boolean, isBeforeToday: boolean): void {
		const dotsContainer = dayEl.createDiv({ cls: "calendarz-dots-container" });

		if (count > 0) {
			// Has notes: show colored dots
			const numDots = Math.min(4, Math.ceil(count / this.dotThreshold));
			for (let i = 0; i < numDots; i++) {
				dotsContainer.createDiv({ cls: "calendarz-dot" });
			}
		} else if (isBeforeToday) {
			// No notes but before today: show gray dot
			dotsContainer.createDiv({ cls: "calendarz-dot calendarz-dot-gray" });
		}
		// Today with no notes: show nothing
	}

	/**
	 * Updates the "today" highlight on the calendar.
	 * Call this periodically to ensure the correct day is highlighted when date changes.
	 * If the date has crossed into a new month, re-renders the entire calendar.
	 */
	async updateTodayHighlight(): Promise<void> {
		const today = dayjs();
		const current = dayjs(this.currentDate);

		// Check if we've crossed into a new month
		if (today.year() !== current.year() || today.month() !== current.month()) {
			// Update current date to today and re-render the entire calendar
			this.currentDate = new Date();
			await this.renderCalendar();
			return;
		}

		// Same month, just update the highlight
		const daysGrid = this.contentEl.querySelector(".calendarz-days");
		if (!daysGrid) return;

		const todayDay = today.date();
		const dayElements = daysGrid.querySelectorAll(".calendarz-day:not(.calendarz-day-other-month)");

		dayElements.forEach((dayEl) => {
			const dayText = dayEl.textContent;
			if (!dayText) return;

			const day = parseInt(dayText, 10);
			if (isNaN(day)) return;

			if (day === todayDay) {
				dayEl.addClass("calendarz-day-today");
			} else {
				dayEl.removeClass("calendarz-day-today");
			}
		});
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

		// Get date counts if display mode is not "none"
		let dateCounts: DateCount[] = [];
		if (this.displayMode !== "none") {
			dateCounts = await this.getDateCounts();
		}

		const daysGrid = new DaysGrid(this.contentEl, this.weekStart, this.displayMode, this.dotThreshold);
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
