/**
 * Minimal interface for plugin-like objects
 * Used to avoid circular dependencies between modules and main.ts
 */

import type { App } from "obsidian";
import type { CalendarZSettings } from "./settings";

/**
 * Base interface with index signature for compatibility with I18n
 */
export interface I18nLike {
	[key: string]: unknown;
}

export interface PluginLike {
	settings: CalendarZSettings;
	i18n: I18nLike;
	app: App;

	saveSettings(): Promise<void>;
	refreshView(): void;
	loadI18n(): void;
	activateView(): Promise<void>;
}
