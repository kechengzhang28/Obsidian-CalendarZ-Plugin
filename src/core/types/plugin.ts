/**
 * Minimal interface for plugin-like objects
 * Used to avoid circular dependencies between modules and main.ts
 */

import type { App } from "obsidian";
import type { CalendarZSettings } from "./settings";
import type { I18n } from "../../i18n";

export interface PluginLike {
	settings: CalendarZSettings;
	app: App;

	getI18n(): I18n;
	saveSettings(): Promise<void>;
	refreshView(): void;
	loadI18n(): void;
	activateView(): Promise<void>;
}
