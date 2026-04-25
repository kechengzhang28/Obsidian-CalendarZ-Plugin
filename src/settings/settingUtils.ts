import type { PluginLike } from "../core/types";

/** Options for creating a setting change handler */
export interface SettingHandlerOptions<K extends keyof PluginLike["settings"]> {
	/** Plugin instance for accessing settings */
	plugin: PluginLike;
	/** Key of the setting to update */
	settingKey: K;
	/** Optional callback to refresh the settings display after change */
	refreshDisplay?: () => void;
	/** Optional value transformer before saving */
	transform?: (value: PluginLike["settings"][K]) => PluginLike["settings"][K];
	/** Optional callback after settings are saved */
	postSave?: () => void | Promise<void>;
}

/**
 * Internal handler that updates a setting value and persists it.
 * @param plugin - Plugin instance
 * @param settingKey - Key of the setting to update
 * @param value - New value for the setting
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
 * Creates a reusable setting change handler.
 * Encapsulates the common pattern of updating, saving, and refreshing after a setting change.
 * @param options - Configuration for the handler
 * @returns Async function that handles value changes
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

// ============================================================================
// i18n Helper Functions - Extracted from settings modules to reduce duplication
// ============================================================================

/**
 * Gets a typed settings section from the i18n object.
 * @param plugin - Plugin instance for accessing i18n
 * @param section - Section name in the settings i18n structure
 * @returns The section object or empty object if not found
 */
function getSettingsSection(plugin: PluginLike, section: string): Record<string, unknown> {
	return (plugin.getI18n().settings as Record<string, Record<string, unknown>>)[section] ?? {};
}

/**
 * Gets a translated string from a settings section.
 * Falls back to the key name if translation is missing.
 * @param plugin - Plugin instance for accessing i18n
 * @param section - Settings section name
 * @param key - Translation key within the section
 * @returns Translated string
 * @example ts(plugin, "monthFormat", "name") // => "Month Format"
 */
export function ts(plugin: PluginLike, section: string, key: string): string {
	const sect = getSettingsSection(plugin, section);
	return (sect[key] as string) ?? key;
}

/**
 * Gets a dropdown option label from nested options object.
 * Falls back to the option key if translation is missing.
 * @param plugin - Plugin instance for accessing i18n
 * @param section - Settings section name
 * @param optionKey - Option key to look up
 * @returns Translated option label
 * @example topt(plugin, "monthFormat", "numeric") // => "Numeric (1-12)"
 */
export function topt(plugin: PluginLike, section: string, optionKey: string): string {
	const sect = getSettingsSection(plugin, section);
	const opts = (sect.options as Record<string, string>) ?? {};
	return opts[optionKey] ?? optionKey;
}

/**
 * Gets a section title from i18n.
 * Falls back to the section key if translation is missing.
 * @param plugin - Plugin instance for accessing i18n
 * @param section - Section key
 * @returns Translated section title
 * @example getSectionTitle(plugin, "basic") // => "Basic Settings"
 */
export function getSectionTitle(plugin: PluginLike, section: string): string {
	const titles = plugin.getI18n().sectionTitles as Record<string, string>;
	return titles[section] ?? section;
}
