import type { PluginLike } from "../../types";
import { SettingGroup } from "../ui/SettingGroup";
import { SliderSettingRenderer } from "../ui/SettingRenderer";
import { createSettingHandler } from "../settingUtils";

/**
 * Renders heatmap settings (max notes for brightness).
 * @param containerEl - Container element
 * @param plugin - Plugin instance
 */
export function renderHeatmapSettings(
	containerEl: HTMLElement,
	plugin: PluginLike
): void {
	const t = plugin.i18n;

	const group = new SettingGroup({ title: t.sectionTitles.heatmap });
	group.render(containerEl);
	const contentEl = group.getContentEl();
	if (!contentEl) return;

	// Heatmap max notes setting
	const sliderRenderer = new SliderSettingRenderer(1, 50, 1, plugin);
	const handleHeatmapMaxNotesChange = createSettingHandler({ plugin, settingKey: "heatmapMaxNotes" });
	sliderRenderer.render(contentEl, {
		name: t.settings.heatmapMaxNotes.name,
		description: t.settings.heatmapMaxNotes.description,
		value: plugin.settings.heatmapMaxNotes,
		onChange: handleHeatmapMaxNotesChange,
	});
}
