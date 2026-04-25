/**
 * Calendar View Controller
 * Handles business logic for the calendar view:
 * - Data fetching (note counts, todo statuses)
 * - User interactions (day click, week click, navigation)
 * - Note creation (daily notes, week notes)
 *
 * This separates business logic from the Obsidian view lifecycle.
 */

import type { App } from "obsidian";
import dayjs from "../../utils/date/dayjsConfig";
import type { CalendarZSettings } from "../../core/types";
import type { I18nLike } from "../../core/types";
import { DATE_FORMAT } from "../../core/constants";
import type { DateCount, DateTodoStatus, WeekTodoStatus } from "../../components/types";
import { NoteCounter, TodoService, DailyNoteService, WeekNoteService } from "../../services";

export interface CalendarViewControllerDeps {
	app: App;
	/** Plugin instance for accessing dynamic i18n and settings */
	plugin: { 
		/** Get current i18n - use getter to always get latest */
		getI18n: () => I18nLike; 
		settings: CalendarZSettings; 
		todoService?: TodoService 
	};
}

export class CalendarViewController {
	private noteCounter: NoteCounter;
	private todoService: TodoService;
	private dailyNoteService: DailyNoteService;
	private weekNoteService: WeekNoteService;
	private currentDate = new Date();

	constructor(private deps: CalendarViewControllerDeps) {
		this.noteCounter = new NoteCounter(deps.app);
		this.todoService = deps.plugin.todoService ?? new TodoService(deps.app);
		this.dailyNoteService = new DailyNoteService(deps.app);
		this.weekNoteService = new WeekNoteService(deps.app);
	}

	/** Dynamically get current settings from plugin */
	get settings(): CalendarZSettings {
		return this.deps.plugin.settings;
	}

	/** Get current i18n from plugin - always fetches latest */
	getI18n(): I18nLike {
		return this.deps.plugin.getI18n();
	}

	get app(): App {
		return this.deps.app;
	}

	getCurrentDate(): Date {
		return this.currentDate;
	}

	setCurrentDate(date: Date): void {
		this.currentDate = date;
	}

	// ---- Navigation ----

	navigateMonth(direction: -1 | 1): void {
		this.currentDate = dayjs(this.currentDate).add(direction, "month").toDate();
	}

	goToToday(): void {
		this.currentDate = new Date();
	}

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

	async getDateCounts(): Promise<DateCount[]> {
		return this.noteCounter.getCounts(this.settings);
	}

	async fetchTodoStatuses(): Promise<DateTodoStatus[]> {
		return this.todoService.fetchDailyTodoStatuses(this.settings);
	}

	async fetchWeekTodoStatuses(): Promise<WeekTodoStatus[]> {
		return this.todoService.fetchWeekTodoStatuses(this.settings);
	}

	// ---- Daily Note Actions ----

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

	async createDailyNote(date: Date): Promise<void> {
		await this.dailyNoteService.openOrCreateDailyNote(date, this.getI18n());
	}

	// ---- Week Note Actions ----

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

	async createWeekNote(date: Date): Promise<void> {
		await this.weekNoteService.openOrCreateWeekNote(date, this.settings, this.getI18n());
	}

	hasWeekNote(date: Date): boolean {
		if (!this.settings.weekNoteEnabled) return false;
		return this.weekNoteService.findWeekNote(date, this.settings) !== null;
	}
}
