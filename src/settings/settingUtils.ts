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

// ============================================================================
// i18n Helper Functions - Extracted from settings modules to reduce duplication
// ============================================================================

/** Get typed settings section from i18n */
function getSettingsSection(plugin: PluginLike, section: string): Record<string, unknown> {
	return (plugin.i18n.settings as Record<string, Record<string, unknown>>)[section] ?? {};
}

/**
 * Get a string value from i18n settings section
 * Usage: ts(plugin, "monthFormat", "name") => "Month Format"
 */
export function ts(plugin: PluginLike, section: string, key: string): string {
	const sect = getSettingsSection(plugin, section);
	return (sect[key] as string) ?? key;
}

/**
 * Get a dropdown option label from nested options object
 * Usage: topt(plugin, "monthFormat", "numeric") => "Numeric (1-12)"
 */
export function topt(plugin: PluginLike, section: string, optionKey: string): string {
	const sect = getSettingsSection(plugin, section);
	const opts = (sect.options as Record<string, string>) ?? {};
	return opts[optionKey] ?? optionKey;
}

/**
 * Get section title from i18n
 * Usage: getSectionTitle(plugin, "basic") => "Basic Settings"
 */
export function getSectionTitle(plugin: PluginLike, section: string): string {
	const titles = plugin.i18n.sectionTitles as Record<string, string>;
	return titles[section] ?? section;
}
