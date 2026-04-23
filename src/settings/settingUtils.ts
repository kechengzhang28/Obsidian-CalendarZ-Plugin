import { PluginLike } from "../types";

/**
 * Creates a standard setting change handler
 * Saves settings and refreshes the view after a setting change
 * 
 * @param plugin - Plugin instance
 * @returns Handler function for setting changes
 */
export function createSettingChangeHandler<T>(
	plugin: PluginLike
): (value: T, settingKey: keyof PluginLike["settings"]) => Promise<void> {
	return async (value: T, settingKey: keyof PluginLike["settings"]) => {
		(plugin.settings as unknown as Record<string, T>)[settingKey as string] = value;
		await plugin.saveSettings();
		plugin.refreshView();
	};
}

/**
 * Creates a setting change handler with custom callback
 * Saves settings, refreshes view, and calls custom callback
 * 
 * @param plugin - Plugin instance
 * @param callback - Additional callback to execute after change
 * @returns Handler function for setting changes
 */
export function createSettingChangeHandlerWithCallback<T>(
	plugin: PluginLike,
	callback?: () => void | Promise<void>
): (value: T, settingKey: keyof PluginLike["settings"]) => Promise<void> {
	return async (value: T, settingKey: keyof PluginLike["settings"]) => {
		(plugin.settings as unknown as Record<string, T>)[settingKey as string] = value;
		await plugin.saveSettings();
		plugin.refreshView();
		if (callback) {
			await callback();
		}
	};
}

/**
 * Type-safe setting change handler factory
 * Use this when you know the specific setting key at creation time
 * 
 * @example
 * ```typescript
 * const handler = createTypedSettingHandler(plugin, 'monthFormat');
 * // handler has type (value: MonthFormat) => Promise<void>
 * ```
 */
export function createTypedSettingHandler<K extends keyof PluginLike["settings"]>(
	plugin: PluginLike,
	settingKey: K
): (value: PluginLike["settings"][K]) => Promise<void> {
	return async (value: PluginLike["settings"][K]) => {
		plugin.settings[settingKey] = value;
		await plugin.saveSettings();
		plugin.refreshView();
	};
}

/**
 * Creates a setting change handler with refresh callback
 * Use for settings that need to refresh the settings UI itself
 * 
 * @param plugin - Plugin instance
 * @param refreshDisplay - Callback to refresh the settings display
 * @param settingKey - The setting key to update
 * @returns Handler function for setting changes
 */
export function createSettingHandlerWithRefresh<T>(
	plugin: PluginLike,
	refreshDisplay: () => void,
	settingKey: keyof PluginLike["settings"]
): (value: T) => Promise<void> {
	return async (value: T) => {
		(plugin.settings as unknown as Record<string, T>)[settingKey] = value;
		await plugin.saveSettings();
		refreshDisplay();
		plugin.refreshView();
	};
}
