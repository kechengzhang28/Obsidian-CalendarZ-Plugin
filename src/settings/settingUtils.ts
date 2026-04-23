import type { PluginLike } from "../types";

export interface SettingHandlerOptions<K extends keyof PluginLike["settings"]> {
	plugin: PluginLike;
	settingKey: K;
	refreshDisplay?: () => void;
	transform?: (value: PluginLike["settings"][K]) => PluginLike["settings"][K];
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

/**
 * @deprecated Use createSettingHandler({ plugin, settingKey }) instead
 */
export function createTypedSettingHandler<K extends keyof PluginLike["settings"]>(
	plugin: PluginLike,
	settingKey: K
): (value: PluginLike["settings"][K]) => Promise<void> {
	return createSettingHandler({ plugin, settingKey });
}

/**
 * @deprecated Use createSettingHandler({ plugin, settingKey, refreshDisplay }) instead
 */
export function createSettingHandlerWithRefresh<K extends keyof PluginLike["settings"]>(
	plugin: PluginLike,
	refreshDisplay: () => void,
	settingKey: K
): (value: PluginLike["settings"][K]) => Promise<void> {
	return createSettingHandler({ plugin, settingKey, refreshDisplay });
}

/**
 * @deprecated Use createSettingHandler({ plugin, settingKey, transform }) instead
 */
export function createSettingHandlerWithTransform<K extends keyof PluginLike["settings"]>(
	plugin: PluginLike,
	settingKey: K,
	transform: (value: PluginLike["settings"][K]) => PluginLike["settings"][K]
): (value: PluginLike["settings"][K]) => Promise<void> {
	return createSettingHandler({ plugin, settingKey, transform });
}
