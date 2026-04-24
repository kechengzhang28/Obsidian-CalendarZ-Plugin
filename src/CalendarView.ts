import { ItemView, WorkspaceLeaf, App } from "obsidian";
import dayjs from "./utils/date/dayjsConfig";
import { mount, unmount } from "svelte";
import type { CalendarZSettings } from "./settings/types";
import type { I18n } from "./i18n";
import type { PluginLike } from "./types/plugin";
import {
	getNotesCountByYamlDate, getNotesCountByFilenameDate, getNotesCountByBoth,
	getWordCountByYamlDate, getWordCountByFilenameDate, getWordCountByBoth
} from "./utils/getNotes";
import { openOrCreateDailyNote, findDailyNote } from "./utils/createNote";
import { DISPLAY_MODE, DATE_SOURCE, DATE_FORMAT, STATISTICS_TYPE } from "./constants";
import Calendar from "./components/Calendar.svelte";
import type { DateCount } from "./components/types";

/** Unique identifier for the CalendarZ view type */
export const CALENDARZ_VIEW_TYPE = "calendarz-view";

/** Dependencies required by the CalendarZ view */
export interface CalendarZViewDeps {
	/** Plugin settings */
	settings: CalendarZSettings;
	/** Obsidian app instance */
	app: App;
	/** Plugin instance for accessing i18n dynamically */
	plugin: PluginLike;
	/** Callback to refresh the view */
	refreshView(): void;
}

/**
 * Calendar view component for Obsidian.
 * Displays an interactive calendar with note statistics and daily note integration.
 */
export class CalendarZView extends ItemView {
	/** Currently displayed month */
	private currentDate = new Date();
	/** View dependencies */
	private deps: CalendarZViewDeps;
	/** Reference to the mounted Svelte component */
	private calendarComponent: ReturnType<typeof mount> | null = null;

	/**
	 * Creates a new calendar view instance.
	 * @param leaf - Workspace leaf to render in
	 * @param deps - View dependencies
	 */
	constructor(leaf: WorkspaceLeaf, deps: CalendarZViewDeps) {
		super(leaf);
		this.deps = deps;
	}

	/** Gets the current plugin settings */
	private get settings(): CalendarZSettings {
		return this.deps.plugin.settings;
	}

	/** Gets the current i18n strings */
	private get i18n(): I18n {
		return this.deps.plugin.i18n;
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

	/**
	 * Updates settings and re-renders the calendar.
	 */
	updateSettings(): void {
		void this.renderCalendar();
	}

	/**
	 * Called when the view is opened.
	 * Renders the calendar component.
	 */
	async onOpen(): Promise<void> {
		await this.renderCalendar();
	}

	/**
	 * Called when the view is closed.
	 * Cleans up the Svelte component.
	 */
	async onClose(): Promise<void> {
		if (this.calendarComponent) {
			await unmount(this.calendarComponent);
			this.calendarComponent = null;
		}
		this.contentEl.empty();
	}

	/**
	 * Refreshes only the statistics display without full re-render.
	 * Efficient update for when note counts change.
	 */
	async refreshStatsOnly(): Promise<void> {
		if (this.settings.displayMode === DISPLAY_MODE.NONE) return;
		void this.renderCalendar(await this.fetchDateCounts());
	}

	/**
	 * Updates the today highlight if the month has changed.
	 * Resets to current month if user navigated away.
	 */
	updateTodayHighlight(): void {
		const today = dayjs();
		const current = dayjs(this.currentDate);

		if (today.year() !== current.year() || today.month() !== current.month()) {
			this.currentDate = new Date();
		}

		void this.renderCalendar();
	}

	/**
	 * Renders the calendar Svelte component.
	 * @param preloadedDateCounts - Optional pre-loaded date counts for efficiency
	 */
	private async renderCalendar(preloadedDateCounts?: DateCount[]): Promise<void> {
		// Clean up previous Svelte component
		if (this.calendarComponent) {
			await unmount(this.calendarComponent);
			this.calendarComponent = null;
		}
		this.contentEl.empty();

		const dateCounts = preloadedDateCounts ?? await this.getDateCountsOrEmpty();

		this.calendarComponent = mount(Calendar, {
			target: this.contentEl,
			props: {
				settings: this.settings,
				i18n: this.i18n,
				dateCounts,
				currentDate: this.currentDate,
				onDayClick: (date: Date) => void this.handleDayClick(date),
				onNavigateMonth: (direction: -1 | 1) => this.navigateMonth(direction),
				onGoToToday: () => this.goToToday(),
			},
		});
	}

	/**
	 * Navigates to the previous or next month.
	 * @param direction - -1 for previous month, 1 for next month
	 */
	private navigateMonth(direction: -1 | 1): void {
		this.currentDate = dayjs(this.currentDate).add(direction, "month").toDate();
		void this.renderCalendar();
	}

	/**
	 * Navigates to the current month (today).
	 */
	private goToToday(): void {
		this.currentDate = new Date();
		void this.renderCalendar();
	}

	/**
	 * Handles click on a calendar day.
	 * Opens existing note or creates new daily note.
	 * @param date - Clicked date
	 */
	private async handleDayClick(date: Date): Promise<void> {
		const existingNote = findDailyNote(this.deps.app, date);

		if (existingNote) {
			await this.deps.app.workspace.openLinkText(existingNote.path, "", false);
			return;
		}

		if (this.settings.confirmBeforeCreate) {
			const { ConfirmModal } = await import("./ui/ConfirmModal");
			const dateStr = dayjs(date).format(DATE_FORMAT);
			new ConfirmModal(
				this.deps.app,
				this.deps.plugin,
				dateStr,
				() => void this.createDailyNote(date)
			).open();
		} else {
			await this.createDailyNote(date);
		}
	}

	/**
	 * Creates a daily note for the specified date.
	 * @param date - Date for the daily note
	 */
	private async createDailyNote(date: Date): Promise<void> {
		await openOrCreateDailyNote(this.deps.app, this.i18n, date);
	}

	/**
	 * Gets date counts or empty array if display mode is none.
	 * @returns Array of date counts
	 */
	private async getDateCountsOrEmpty(): Promise<DateCount[]> {
		if (this.settings.displayMode === DISPLAY_MODE.NONE) return [];
		return await this.fetchDateCounts();
	}

	/**
	 * Fetches note counts grouped by date.
	 * Uses either YAML frontmatter, filename, or both based on settings.
	 * Also considers statistics type (count vs word count).
	 * @returns Array of date counts
	 */
	private async fetchDateCounts(): Promise<DateCount[]> {
		const { dateSource, ignoredFolders, dateFieldName, filenameDateFormat, statisticsType } = this.settings;
		const isWordCount = statisticsType === STATISTICS_TYPE.WORD_COUNT;

		if (dateSource === DATE_SOURCE.FILENAME) {
			return isWordCount
				? await getWordCountByFilenameDate(this.deps.app, ignoredFolders, filenameDateFormat)
				: getNotesCountByFilenameDate(this.deps.app, ignoredFolders, filenameDateFormat);
		}
		if (dateSource === DATE_SOURCE.BOTH) {
			return isWordCount
				? await getWordCountByBoth(this.deps.app, ignoredFolders, dateFieldName, filenameDateFormat)
				: getNotesCountByBoth(this.deps.app, ignoredFolders, dateFieldName, filenameDateFormat);
		}
		return isWordCount
			? await getWordCountByYamlDate(this.deps.app, ignoredFolders, dateFieldName)
			: getNotesCountByYamlDate(this.deps.app, ignoredFolders, dateFieldName);
	}
}
