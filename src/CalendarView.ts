import { ItemView, WorkspaceLeaf, App } from "obsidian";
import dayjs from "dayjs";
import { mount, unmount } from "svelte";
import type { CalendarZSettings } from "./settings/types";
import type { I18n } from "./i18n";
import { getNotesCountByYamlDate, getNotesCountByFilenameDate } from "./utils/GetNotes";
import { openOrCreateDailyNote, findDailyNote } from "./utils/createNote";
import { DISPLAY_MODE, DATE_SOURCE, DATE_FORMAT } from "./constants";
import Calendar from "./components/Calendar.svelte";
import type { DateCount } from "./components/types";

export const CALENDARZ_VIEW_TYPE = "calendarz-view";

export interface CalendarZViewDeps {
	settings: CalendarZSettings;
	i18n: I18n;
	app: App;
	refreshView(): void;
}

export class CalendarZView extends ItemView {
	private currentDate = new Date();
	private deps: CalendarZViewDeps;
	private calendarComponent: ReturnType<typeof mount> | null = null;

	constructor(leaf: WorkspaceLeaf, deps: CalendarZViewDeps) {
		super(leaf);
		this.deps = deps;
	}

	private get settings(): CalendarZSettings {
		return this.deps.settings;
	}

	getViewType(): string {
		return CALENDARZ_VIEW_TYPE;
	}

	getDisplayText(): string {
		return this.deps.i18n.calendar.viewTitle;
	}

	getIcon(): string {
		return "calendar";
	}

	updateSettings(): void {
		void this.renderCalendar();
	}

	async onOpen(): Promise<void> {
		await this.renderCalendar();
	}

	async onClose(): Promise<void> {
		if (this.calendarComponent) {
			void unmount(this.calendarComponent);
			this.calendarComponent = null;
		}
		this.contentEl.empty();
	}

	async refreshStatsOnly(): Promise<void> {
		if (this.settings.displayMode === DISPLAY_MODE.NONE) return;

		const dateCounts = await this.fetchDateCounts();
		if (this.calendarComponent) {
			// Re-mount with updated dateCounts
			void this.renderCalendar(dateCounts);
		} else {
			void this.renderCalendar();
		}
	}

	async updateTodayHighlight(): Promise<void> {
		const today = dayjs();
		const current = dayjs(this.currentDate);

		if (today.year() !== current.year() || today.month() !== current.month()) {
			this.currentDate = new Date();
			await this.renderCalendar();
			return;
		}

		// Svelte handles reactivity, just re-render with same data
		const dateCounts = this.settings.displayMode !== DISPLAY_MODE.NONE
			? await this.fetchDateCounts()
			: [];
		void this.renderCalendar(dateCounts);
	}

	private async renderCalendar(preloadedDateCounts?: DateCount[]): Promise<void> {
		// Clean up previous Svelte component
		if (this.calendarComponent) {
			void unmount(this.calendarComponent);
			this.calendarComponent = null;
		}
		this.contentEl.empty();

		const dateCounts = preloadedDateCounts ?? (
			this.settings.displayMode !== DISPLAY_MODE.NONE
				? await this.fetchDateCounts()
				: []
		);

		this.calendarComponent = mount(Calendar, {
			target: this.contentEl,
			props: {
				settings: this.settings,
				i18n: this.deps.i18n,
				dateCounts,
				currentDate: this.currentDate,
				onDayClick: (date: Date) => void this.handleDayClick(date),
				onNavigateMonth: (direction: -1 | 1) => this.navigateMonth(direction),
				onGoToToday: () => this.goToToday(),
			},
		});
	}

	private navigateMonth(direction: -1 | 1): void {
		this.currentDate = dayjs(this.currentDate).add(direction, "month").toDate();
		void this.renderCalendar();
	}

	private goToToday(): void {
		this.currentDate = new Date();
		void this.renderCalendar();
	}

	private async handleDayClick(date: Date): Promise<void> {
		const existingNote = findDailyNote(date);

		if (existingNote) {
			await this.deps.app.workspace.openLinkText(existingNote.path, "", false);
			return;
		}

		if (this.settings.confirmBeforeCreate) {
			const { ConfirmModal } = await import("./ui/ConfirmModal");
			const dateStr = dayjs(date).format(DATE_FORMAT);
			new ConfirmModal(
				this.deps.app,
				this.deps.i18n,
				dateStr,
				() => void this.createDailyNote(date)
			).open();
		} else {
			await this.createDailyNote(date);
		}
	}

	private async createDailyNote(date: Date): Promise<void> {
		await openOrCreateDailyNote(this.deps.app, this.deps.i18n, date);
	}

	private async fetchDateCounts(): Promise<DateCount[]> {
		const { dateSource, ignoredFolders, dateFieldName, filenameDateFormat } = this.settings;

		if (dateSource === DATE_SOURCE.FILENAME) {
			return getNotesCountByFilenameDate(this.deps.app, ignoredFolders, filenameDateFormat);
		}
		return getNotesCountByYamlDate(this.deps.app, ignoredFolders, dateFieldName);
	}
}
