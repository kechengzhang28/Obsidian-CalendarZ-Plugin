import type { PluginLike } from "../../core/types";
import { SettingGroup } from "../ui/SettingGroup";
import { ToggleSettingRenderer } from "../ui/SettingRenderer";
import { createSettingHandler, ts, getSectionTitle } from "../settingUtils";

/**
 * Renders click behavior settings.
 * @param containerEl - Container element
 * @param plugin - Plugin instance
 */
export function renderClickSettings(containerEl: HTMLElement, plugin: PluginLike): void {
	const group = new SettingGroup({ title: getSectionTitle(plugin, "click") });
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
