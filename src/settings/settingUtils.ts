import type { PluginLike } from "../core/types";
import type { I18n } from "../i18n";

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
// i18n Helper Functions
// ============================================================================

/** Type-safe mapping from section names to their settings object types */
type SettingsSection = I18n["settings"];
type SettingsSectionKey = keyof SettingsSection;

/**
 * Gets a translated string from a settings section.
 * Falls back to the key name if translation is missing.
 * @param plugin - Plugin instance for accessing i18n
 * @param section - Settings section name
 * @param key - Translation key within the section
 * @returns Translated string
 * @example ts(plugin, "monthFormat", "name") // => "Month Format"
 */
export function ts(plugin: PluginLike, section: SettingsSectionKey, key: string): string {
	const sect = plugin.getI18n().settings[section];
	if (!sect || typeof sect !== "object") return key;
	return (sect as Record<string, string>)[key] ?? key;
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
export function topt(plugin: PluginLike, section: SettingsSectionKey, optionKey: string): string {
	const sect = plugin.getI18n().settings[section];
	if (!sect || typeof sect !== "object") return optionKey;
	const opts = "options" in sect ? (sect as { options: Record<string, string> }).options : undefined;
	if (!opts) return optionKey;
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
export function getSectionTitle(plugin: PluginLike, section: keyof I18n["sectionTitles"]): string {
	return plugin.getI18n().sectionTitles[section] ?? section;
}
