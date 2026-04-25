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
import { createCalendarState } from "../../stores/calendarState.svelte";

/** Unique identifier for the CalendarZ view type */
export const CALENDARZ_VIEW_TYPE = "calendarz-view";

/**
 * Dependencies required by the CalendarZ view
 */
export interface CalendarZViewDeps {
	/** Obsidian app instance */
	app: App;
	/** Plugin instance for accessing dynamic i18n and settings */
	plugin: { 
		/** Get current i18n - use getter to always get latest */
		getI18n: () => I18n; 
		settings: CalendarZSettings; 
		todoService?: import("../../services/todos/TodoService").TodoService 
	};
}

/**
 * Calendar view component for Obsidian.
 */
export class CalendarZView extends ItemView {
	private controller: CalendarViewController;
	private calendarComponent: ReturnType<typeof mount> | null = null;
	private state = createCalendarState();

	constructor(leaf: WorkspaceLeaf, deps: CalendarZViewDeps) {
		super(leaf);
		this.controller = new CalendarViewController(deps);
	}

	private get settings(): CalendarZSettings {
		return this.controller.settings;
	}

	private get i18n(): I18n {
		return this.controller.getI18n() as unknown as I18n;
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
	 * Initialize state with current settings and data
	 */
	private initializeState(): void {
		this.state.setSettings(this.settings);
		this.state.setI18n(this.i18n);
		this.state.setCurrentDate(this.controller.getCurrentDate());
	}

	/**
	 * Updates settings - state will trigger reactive updates in Svelte components
	 */
	updateSettings(): void {
		this.state.setSettings(this.settings);
		this.state.setI18n(this.i18n);
	}

	/**
	 * Refreshes statistics data only - uses reactive state updates instead of DOM manipulation.
	 * This triggers Svelte's fine-grained reactivity to update only changed cells.
	 */
	async refreshStatsOnly(): Promise<void> {
		if (this.settings.displayMode === "none") return;
		
		const dateCounts = await this.controller.getDateCounts();
		const todoStatuses = await this.controller.fetchTodoStatuses();
		const weekTodoStatuses = await this.controller.fetchWeekTodoStatuses();
		
		// Single state update triggers reactive re-render in Svelte
		this.state.updateData(dateCounts, todoStatuses, weekTodoStatuses);
	}

	/**
	 * Updates the today highlight if the month has changed.
	 */
	updateTodayHighlight(): void {
		if (this.controller.updateTodayHighlight()) {
			this.state.setCurrentDate(this.controller.getCurrentDate());
		}
	}

	async onOpen(): Promise<void> {
		// Initialize state BEFORE mounting component
		this.initializeState();

		// Initial data load
		const dateCounts = await this.controller.getDateCounts();
		const todoStatuses = await this.controller.fetchTodoStatuses();
		const weekTodoStatuses = await this.controller.fetchWeekTodoStatuses();
		this.state.updateData(dateCounts, todoStatuses, weekTodoStatuses);

		// Mount Svelte component once - it will react to state changes
		this.calendarComponent = mount(Calendar, {
			target: this.contentEl,
			props: {
				state: this.state,
				onDayClick: (date: Date) => { void this.controller.handleDayClick(date); },
				onWeekClick: (date: Date) => { void this.controller.handleWeekClick(date); },
				onNavigateMonth: (direction: -1 | 1) => {
					this.controller.navigateMonth(direction);
					this.state.setCurrentDate(this.controller.getCurrentDate());
				},
				onGoToToday: () => {
					this.controller.goToToday();
					this.state.setCurrentDate(this.controller.getCurrentDate());
				},
				hasWeekNote: (date: Date) => this.controller.hasWeekNote(date),
			},
		});
	}

	async onClose(): Promise<void> {
		if (this.calendarComponent) {
			await unmount(this.calendarComponent);
			this.calendarComponent = null;
		}
		this.contentEl.empty();
	}
}
