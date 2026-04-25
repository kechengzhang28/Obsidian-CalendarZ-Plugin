import type { PluginLike } from "../../core/types";
import { SettingGroup } from "../ui/SettingGroup";
import { ToggleSettingRenderer } from "../ui/SettingRenderer";
import { createSettingHandler } from "../settingUtils";

/** Helper to get nested i18n string values */
function ts(plugin: PluginLike, section: string, key: string): string {
	return ((plugin.i18n.settings as Record<string, Record<string, string>>)[section]!)[key]!;
}

/**
 * Renders click behavior settings.
 * @param containerEl - Container element
 * @param plugin - Plugin instance
 */
export function renderClickSettings(containerEl: HTMLElement, plugin: PluginLike): void {
	const sectionTitles = plugin.i18n.sectionTitles as Record<string, string>;
	const group = new SettingGroup({ title: sectionTitles.click! });
	group.render(containerEl);
	const contentEl = group.getContentEl();
	if (!contentEl) return;

	// Confirm before creating daily note setting
	const toggleRenderer = new ToggleSettingRenderer(plugin);
	const handleConfirmChange = createSettingHandler({ plugin, settingKey: "confirmBeforeCreate" });
	toggleRenderer.render(contentEl, {
		name: ts(plugin, "confirmBeforeCreate", "name"),
		description: ts(plugin, "confirmBeforeCreate", "description"),
		value: plugin.settings.confirmBeforeCreate,
		onChange: handleConfirmChange,
	});
}
