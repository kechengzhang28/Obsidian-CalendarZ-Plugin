import type { PluginLike } from "../../types";
import { SettingGroup } from "../ui/SettingGroup";
import { ToggleSettingRenderer } from "../ui/SettingRenderer";
import { createTypedSettingHandler } from "../settingUtils";

/**
 * Renders click behavior settings.
 * @param containerEl - Container element
 * @param plugin - Plugin instance
 */
export function renderClickSettings(containerEl: HTMLElement, plugin: PluginLike): void {
	const t = plugin.i18n;

	const group = new SettingGroup({ title: t.sectionTitles.click });
	group.render(containerEl);
	const contentEl = group.getContentEl();
	if (!contentEl) return;

	// Confirm before creating daily note setting
	const toggleRenderer = new ToggleSettingRenderer(plugin);
	const handleConfirmChange = createTypedSettingHandler(plugin, "confirmBeforeCreate");
	toggleRenderer.render(contentEl, {
		name: t.settings.confirmBeforeCreate.name,
		description: t.settings.confirmBeforeCreate.description,
		value: plugin.settings.confirmBeforeCreate,
		onChange: handleConfirmChange,
	});
}
