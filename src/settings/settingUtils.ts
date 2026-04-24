import type { PluginLike } from "../types";

/** Options for creating a setting change handler */
export interface SettingHandlerOptions<K extends keyof PluginLike["settings"]> {
	/** Plugin instance */
	plugin: PluginLike;
	/** Key of the setting to handle */
	settingKey: K;
	/** Optional callback to refresh the display after change */
	refreshDisplay?: () => void;
	/** Optional transform function to modify the value before saving */
	transform?: (value: PluginLike["settings"][K]) => PluginLike["settings"][K];
	/** Optional callback to execute after saving */
	postSave?: () => void | Promise<void>;
}

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
 * Universal setting change handler factory
 * Supports optional transform, refreshDisplay callback, and postSave hook
 *
 * @example
 * ```typescript
 * // Basic usage
 * const handler = createSettingHandler({ plugin, settingKey: 'monthFormat' });
 *
 * // With refresh
 * const handler = createSettingHandler({ plugin, settingKey: 'displayMode', refreshDisplay });
 *
 * // With transform
 * const handler = createSettingHandler({
 *   plugin, settingKey: 'dateFieldName',
 *   transform: (v) => v.trim() || 'date'
 * });
 * ```
 */
export function createSettingHandler<K extends keyof PluginLike["settings"]>(
	options: SettingHandlerOptions<K>
): (value: PluginLike["settings"][K]) => Promise<void> {
	const { plugin, settingKey, refreshDisplay, transform, postSave } = options;

	return async (value) => {
		const finalValue = transform ? transform(value) : value;
		await handleSettingChange(plugin, settingKey, finalValue);
		refreshDisplay?.();
		await postSave?.();
	};
}
