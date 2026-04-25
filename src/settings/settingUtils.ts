import type { PluginLike } from "../core/types";

/** Options for creating a setting change handler */
export interface SettingHandlerOptions<K extends keyof PluginLike["settings"]> {
	plugin: PluginLike;
	settingKey: K;
	refreshDisplay?: () => void;
	transform?: (value: PluginLike["settings"][K]) => PluginLike["settings"][K];
	postSave?: () => void | Promise<void>;
}

async function handleSettingChange<K extends keyof PluginLike["settings"]>(
	plugin: PluginLike,
	settingKey: K,
	value: PluginLike["settings"][K]
): Promise<void> {
	plugin.settings[settingKey] = value;
	await plugin.saveSettings();
	plugin.refreshView();
}

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
