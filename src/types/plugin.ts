import { App } from "obsidian";
import { I18n } from "../i18n";
import { CalendarZSettings } from "../settings/types";

/**
 * Minimal interface for plugin-like objects
 * Used to avoid circular dependencies between modules and main.ts
 * 
 * This interface defines the contract that any plugin-like object must satisfy
 * to be used by settings modules and utility functions.
 */
export interface PluginLike {
	/** Plugin settings */
	settings: CalendarZSettings;
	/** Internationalization strings */
	i18n: I18n;
	/** Obsidian app instance */
	app: App;

	/**
	 * Saves the current settings to storage
	 */
	saveSettings(): Promise<void>;

	/**
	 * Refreshes the calendar view with current settings
	 */
	refreshView(): void;

	/**
	 * Reloads internationalization strings based on current language setting
	 */
	loadI18n(): void;

	/**
	 * Activates the calendar view
	 */
	activateView(): Promise<void>;
}
