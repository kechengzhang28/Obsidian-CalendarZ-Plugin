import type { PluginLike } from "../types";

/**
 * Base handler that updates a setting, saves it, and refreshes the view
 */
async function handleSettingChange<K extends keyof PluginLike["settings"]>(
	plugin: PluginLike,
	settingKey: K,
	value: PluginLike["settings"][K]
): Promise<void> {
	plugin.settings[settingKey] = value;
	await plugin.saveSettings();
	plugin.refreshView();
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
	return async (value) => handleSettingChange(plugin, settingKey, value);
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
	return async (value) => {
		await handleSettingChange(plugin, settingKey, value);
		refreshDisplay();
	};
}

/**
 * Creates a setting change handler with custom post-save action
 * Use for settings that need additional logic after saving (e.g., default value fallback)
 *
 * @param plugin - Plugin instance
 * @param settingKey - The setting key to update
 * @param transform - Optional transform function applied to value before saving
 * @returns Handler function for setting changes
 */
export function createSettingHandlerWithTransform<K extends keyof PluginLike["settings"]>(
	plugin: PluginLike,
	settingKey: K,
	transform: (value: PluginLike["settings"][K]) => PluginLike["settings"][K]
): (value: PluginLike["settings"][K]) => Promise<void> {
	return async (value) => {
		const transformed = transform(value);
		await handleSettingChange(plugin, settingKey, transformed);
	};
}
