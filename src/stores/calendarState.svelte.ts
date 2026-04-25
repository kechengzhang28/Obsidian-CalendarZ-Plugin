/**
 * Calendar reactive state management using Svelte 5 runes
 * Provides fine-grained reactivity to minimize DOM operations
 */

import type { DateCount, DateTodoStatus, WeekTodoStatus } from "../components/types";
import type { CalendarZSettings } from "../core/types";
import type { I18n } from "../i18n";

/**
 * Reactive calendar state container
 * Uses Svelte 5 runes for fine-grained reactivity
 */
export function createCalendarState() {
	// Core state - these trigger updates when changed
	let currentDate = $state<Date>(new Date());
	let dateCounts = $state<DateCount[]>([]);
	let todoStatuses = $state<DateTodoStatus[]>([]);
	let weekTodoStatuses = $state<WeekTodoStatus[]>([]);
	let settings = $state<CalendarZSettings | null>(null);
	let i18n = $state<I18n | null>(null);

	// Derived state - automatically updates when dependencies change
	const countsMap = $derived(
		new Map(dateCounts.map((d) => [d.date, d.count]))
	);

	const todoMap = $derived(
		new Map(todoStatuses.map((t) => [t.date, t]))
	);

	const weekTodoMap = $derived(
		new Map(weekTodoStatuses.map((t) => [t.weekKey, t]))
	);

	return {
		// Getters
		get currentDate() { return currentDate; },
		get dateCounts() { return dateCounts; },
		get todoStatuses() { return todoStatuses; },
		get weekTodoStatuses() { return weekTodoStatuses; },
		get settings() { return settings; },
		get i18n() { return i18n; },
		get countsMap() { return countsMap; },
		get todoMap() { return todoMap; },
		get weekTodoMap() { return weekTodoMap; },

		// Setters
		setCurrentDate(date: Date) { currentDate = date; },
		setDateCounts(counts: DateCount[]) { dateCounts = counts; },
		setTodoStatuses(statuses: DateTodoStatus[]) { todoStatuses = statuses; },
		setWeekTodoStatuses(statuses: WeekTodoStatus[]) { weekTodoStatuses = statuses; },
		setSettings(newSettings: CalendarZSettings) { settings = newSettings; },
		setI18n(newI18n: I18n) { i18n = newI18n; },

		// Batch update for data refresh (single reactivity trigger)
		updateData(counts: DateCount[], todos: DateTodoStatus[], weekTodos: WeekTodoStatus[]) {
			dateCounts = counts;
			todoStatuses = todos;
			weekTodoStatuses = weekTodos;
		},
	};
}

export type CalendarState = ReturnType<typeof createCalendarState>;
