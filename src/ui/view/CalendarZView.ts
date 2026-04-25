/**
 * Calendar view component for Obsidian.
 * Displays an interactive calendar with note statistics and daily note integration.
 *
 * This class focuses solely on Obsidian view lifecycle and Svelte component management.
 * All business logic is delegated to CalendarViewController.
 */

import { ItemView, WorkspaceLeaf, App } from "obsidian";
import { mount, unmount } from "svelte";
import type { I18n } from "../../i18n";
import type { CalendarZSettings } from "../../core/types";
import { CalendarViewController } from "./CalendarViewController";
import Calendar from "../../components/Calendar.svelte";
import type { DateCount } from "../../components/types";

/** Unique identifier for the CalendarZ view type */
export const CALENDARZ_VIEW_TYPE = "calendarz-view";

/**
 * Dependencies required by the CalendarZ view
 */
export interface CalendarZViewDeps {
	/** Obsidian app instance */
	app: App;
	/** Plugin instance for accessing dynamic i18n and settings */
	plugin: { i18n: I18n; settings: CalendarZSettings };
}

/**
 * Calendar view component for Obsidian.
 */
export class CalendarZView extends ItemView {
	private controller: CalendarViewController;
	private calendarComponent: ReturnType<typeof mount> | null = null;

	constructor(leaf: WorkspaceLeaf, deps: CalendarZViewDeps) {
		super(leaf);
		this.controller = new CalendarViewController(deps);
	}

	private get settings(): CalendarZSettings {
		return this.controller.settings;
	}

	private get i18n(): I18n {
		return this.controller.i18n as unknown as I18n;
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

	/**
	 * Updates settings and re-renders the calendar.
	 */
	updateSettings(): void {
		void this.renderCalendar();
	}

	/**
	 * Refreshes only the statistics display without full re-render.
	 */
	async refreshStatsOnly(): Promise<void> {
		if (this.settings.displayMode === "none") return;
		void this.renderCalendar(await this.controller.getDateCounts());
	}

	/**
	 * Updates the today highlight if the month has changed.
	 */
	updateTodayHighlight(): void {
		if (this.controller.updateTodayHighlight()) {
			void this.renderCalendar();
		}
	}

	async onOpen(): Promise<void> {
		await this.renderCalendar();
	}

	async onClose(): Promise<void> {
		if (this.calendarComponent) {
			await unmount(this.calendarComponent);
			this.calendarComponent = null;
		}
		this.contentEl.empty();
	}

	/**
	 * Renders the calendar Svelte component.
	 */
	private async renderCalendar(preloadedDateCounts?: DateCount[]): Promise<void> {
		if (this.calendarComponent) {
			await unmount(this.calendarComponent);
			this.calendarComponent = null;
		}
		this.contentEl.empty();

		const dateCounts = preloadedDateCounts ?? await this.controller.getDateCounts();
		const todoStatuses = await this.controller.fetchTodoStatuses();
		const weekTodoStatuses = await this.controller.fetchWeekTodoStatuses();

		this.calendarComponent = mount(Calendar, {
			target: this.contentEl,
			props: {
				settings: this.settings,
				i18n: this.i18n,
				dateCounts,
				todoStatuses,
				weekTodoStatuses,
				currentDate: this.controller.getCurrentDate(),
				onDayClick: (date: Date) => { void this.controller.handleDayClick(date); },
				onWeekClick: (date: Date) => { void this.controller.handleWeekClick(date); },
				onNavigateMonth: (direction: -1 | 1) => {
					this.controller.navigateMonth(direction);
					void this.renderCalendar();
				},
				onGoToToday: () => {
					this.controller.goToToday();
					void this.renderCalendar();
				},
				hasWeekNote: (date: Date) => this.controller.hasWeekNote(date),
			},
		});
	}
}
