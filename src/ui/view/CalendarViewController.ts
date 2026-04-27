/**
 * Calendar View Controller
 * Handles business logic for the calendar view:
 * - Data fetching (note counts, todo statuses)
 * - User interactions (day click, week click, navigation)
 * - Note creation (daily notes, week notes, month notes, year notes)
 *
 * This separates business logic from the Obsidian view lifecycle.
 */

import type { App } from "obsidian";
import dayjs from "../../utils/date/dayjsConfig";
import type { CalendarZSettings } from "../../core/types";
import type { I18nLike } from "../../core/types";
import { DATE_FORMAT } from "../../core/constants";
import type { DateCount, DateTodoStatus, WeekTodoStatus } from "../../components/types";
import { NoteCounter, TodoService, DailyNoteService, WeekNoteService, MonthNoteService, YearNoteService } from "../../services";

/**
 * Dependencies required by the CalendarViewController.
 * Passed from the view to avoid circular dependencies.
 */
export interface CalendarViewControllerDeps {
	/** Obsidian app instance */
	app: App;
	/** Plugin instance for accessing dynamic i18n and settings */
	plugin: {
		/** Get current i18n - use getter to always get latest */
		getI18n: () => I18nLike;
		/** Current plugin settings */
		settings: CalendarZSettings;
		/** Optional todo service for fetching todo statuses */
		todoService?: TodoService;
		/** Optional note counter for fetching date counts */
		noteCounter?: NoteCounter;
	};
}

/**
 * Controller for calendar view business logic.
 * Manages navigation, data fetching, and note creation actions.
 */
export class CalendarViewController {
	/** Service for counting notes by date */
	private noteCounter: NoteCounter;
	/** Service for detecting todo statuses */
	private todoService: TodoService;
	/** Service for daily note operations */
	private dailyNoteService: DailyNoteService;
	/** Service for week note operations */
	private weekNoteService: WeekNoteService;
	/** Service for month note operations */
	private monthNoteService: MonthNoteService;
	/** Service for year note operations */
	private yearNoteService: YearNoteService;
	/** Currently displayed month/date in the calendar */
	private currentDate = new Date();

	/**
	 * Creates a new CalendarViewController instance
	 * @param deps - Dependencies required by the controller
	 */
	constructor(private deps: CalendarViewControllerDeps) {
		this.noteCounter = deps.plugin.noteCounter ?? new NoteCounter(deps.app);
		this.todoService = deps.plugin.todoService ?? new TodoService(deps.app);
		this.dailyNoteService = new DailyNoteService(deps.app);
		this.weekNoteService = new WeekNoteService(deps.app);
		this.monthNoteService = new MonthNoteService(deps.app);
		this.yearNoteService = new YearNoteService(deps.app);
	}

	/** Dynamically gets current settings from the plugin */
	get settings(): CalendarZSettings {
		return this.deps.plugin.settings;
	}

	/** Gets current i18n from plugin - always fetches latest */
	getI18n(): I18nLike {
		return this.deps.plugin.getI18n();
	}

	/** Obsidian app instance */
	get app(): App {
		return this.deps.app;
	}

	/** Returns the currently displayed date */
	getCurrentDate(): Date {
		return this.currentDate;
	}

	/** Sets the currently displayed date */
	setCurrentDate(date: Date): void {
		this.currentDate = date;
	}

	// ---- Navigation ----

	/**
	 * Navigates to the previous or next month.
	 * @param direction - -1 for previous month, 1 for next month
	 */
	navigateMonth(direction: -1 | 1): void {
		this.currentDate = dayjs(this.currentDate).add(direction, "month").toDate();
	}

	/** Resets the current date to today */
	goToToday(): void {
		this.currentDate = new Date();
	}

	/**
	 * Updates the current date to today if the month has changed.
	 * @returns True if the date was updated
	 */
	updateTodayHighlight(): boolean {
		const today = dayjs();
		const current = dayjs(this.currentDate);
		if (today.year() !== current.year() || today.month() !== current.month()) {
			this.currentDate = new Date();
			return true;
		}
		return false;
	}

	// ---- Data Fetching ----

	/**
	 * Fetches note counts grouped by date.
	 * @returns Array of date-count pairs
	 */
	async getDateCounts(): Promise<DateCount[]> {
		return this.noteCounter.getCounts(this.settings);
	}

	/**
	 * Fetches todo statuses for daily notes.
	 * @returns Array of date-todo status pairs
	 */
	async fetchTodoStatuses(): Promise<DateTodoStatus[]> {
		return this.todoService.fetchDailyTodoStatuses(this.settings);
	}

	/**
	 * Fetches todo statuses for week notes.
	 * @returns Array of week-todo status pairs
	 */
	async fetchWeekTodoStatuses(): Promise<WeekTodoStatus[]> {
		return this.todoService.fetchWeekTodoStatuses(this.settings);
	}

	// ---- Daily Note Actions ----

	/**
	 * Handles click on a day cell.
	 * Opens existing daily note or shows confirmation to create a new one.
	 * @param date - The clicked date
	 */
	async handleDayClick(date: Date): Promise<void> {
		const existingNote = this.dailyNoteService.findDailyNote(date);

		if (existingNote) {
			await this.deps.app.workspace.openLinkText(existingNote.path, "", false);
			return;
		}

		if (this.settings.confirmBeforeCreate) {
			const { ConfirmModal } = await import("../modals/ConfirmModal");
			const dateStr = dayjs(date).format(DATE_FORMAT);
			new ConfirmModal(
				this.deps.app,
				this.getI18n(),
				dateStr,
				() => void this.createDailyNote(date)
			).open();
		} else {
			await this.createDailyNote(date);
		}
	}

	/**
	 * Creates or opens a daily note for the given date.
	 * @param date - Target date for the daily note
	 */
	async createDailyNote(date: Date): Promise<void> {
		await this.dailyNoteService.openOrCreateDailyNote(date, this.getI18n());
	}

	// ---- Week Note Actions ----

	/**
	 * Handles click on a week number.
	 * Opens existing week note or shows confirmation to create a new one.
	 * @param date - Any date within the target week
	 */
	async handleWeekClick(date: Date): Promise<void> {
		if (!this.settings.weekNoteEnabled) return;

		const existingNote = this.weekNoteService.findWeekNote(date, this.settings);

		if (existingNote) {
			await this.deps.app.workspace.openLinkText(existingNote.path, "", false);
			return;
		}

		if (this.settings.confirmBeforeCreate) {
			const { ConfirmModal } = await import("../modals/ConfirmModal");
			const dateRange = this.weekNoteService.getWeekDateRange(date, this.settings.weekStart);
			new ConfirmModal(
				this.deps.app,
				this.getI18n(),
				dateRange,
				() => void this.createWeekNote(date)
			).open();
		} else {
			await this.createWeekNote(date);
		}
	}

	/**
	 * Creates or opens a week note for the given date.
	 * @param date - Any date within the target week
	 */
	async createWeekNote(date: Date): Promise<void> {
		await this.weekNoteService.openOrCreateWeekNote(date, this.settings, this.getI18n());
	}

	/**
	 * Checks if a week note exists for the given date.
	 * @param date - Any date within the target week
	 * @returns True if a week note exists
	 */
	hasWeekNote(date: Date): boolean {
		if (!this.settings.weekNoteEnabled) return false;
		return this.weekNoteService.findWeekNote(date, this.settings) !== null;
	}

	// ---- Month Note Actions ----

	/**
	 * Handles click on the month header.
	 * Opens existing month note or shows confirmation to create a new one.
	 * @param date - Any date within the target month
	 */
	async handleMonthClick(date: Date): Promise<void> {
		if (!this.settings.monthNoteEnabled) return;

		const existingNote = this.monthNoteService.findMonthNote(date, this.settings);

		if (existingNote) {
			await this.deps.app.workspace.openLinkText(existingNote.path, "", false);
			return;
		}

		if (this.settings.confirmBeforeCreate) {
			const { ConfirmModal } = await import("../modals/ConfirmModal");
			const monthStr = dayjs(date).format("YYYY-MM");
			new ConfirmModal(
				this.deps.app,
				this.getI18n(),
				monthStr,
				() => void this.createMonthNote(date)
			).open();
		} else {
			await this.createMonthNote(date);
		}
	}

	/**
	 * Creates or opens a month note for the given date.
	 * @param date - Any date within the target month
	 */
	async createMonthNote(date: Date): Promise<void> {
		await this.monthNoteService.openOrCreateMonthNote(date, this.settings, this.getI18n());
	}

	// ---- Year Note Actions ----

	/**
	 * Handles click on the year header.
	 * Opens existing year note or shows confirmation to create a new one.
	 * @param date - Any date within the target year
	 */
	async handleYearClick(date: Date): Promise<void> {
		if (!this.settings.yearNoteEnabled) return;

		const existingNote = this.yearNoteService.findYearNote(date, this.settings);

		if (existingNote) {
			await this.deps.app.workspace.openLinkText(existingNote.path, "", false);
			return;
		}

		if (this.settings.confirmBeforeCreate) {
			const { ConfirmModal } = await import("../modals/ConfirmModal");
			const yearStr = dayjs(date).format("YYYY");
			new ConfirmModal(
				this.deps.app,
				this.getI18n(),
				yearStr,
				() => void this.createYearNote(date)
			).open();
		} else {
			await this.createYearNote(date);
		}
	}

	/**
	 * Creates or opens a year note for the given date.
	 * @param date - Any date within the target year
	 */
	async createYearNote(date: Date): Promise<void> {
		await this.yearNoteService.openOrCreateYearNote(date, this.settings, this.getI18n());
	}
}
