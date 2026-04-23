import { PluginLike } from "../types";

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
export function createSettingHandlerWithRefresh<K extends keyof PluginLike["settings"]>(
	plugin: PluginLike,
	refreshDisplay: () => void,
	settingKey: K
): (value: PluginLike["settings"][K]) => Promise<void> {
	return async (value: PluginLike["settings"][K]) => {
		plugin.settings[settingKey] = value;
		await plugin.saveSettings();
		refreshDisplay();
		plugin.refreshView();
	};
}
