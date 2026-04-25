import type { PluginLike } from "../../core/types";
import { SettingGroup } from "../ui/SettingGroup";
import { SliderSettingRenderer, NumberSettingRenderer, ToggleSettingRenderer } from "../ui/SettingRenderer";
import { createSettingHandler } from "../settingUtils";

/** Helper to get nested i18n string values */
function ts(plugin: PluginLike, section: string, key: string): string {
	return ((plugin.i18n.settings as Record<string, Record<string, string>>)[section]!)[key]!;
}

/**
 * Renders heatmap settings (max notes for brightness).
 * @param containerEl - Container element
 * @param plugin - Plugin instance
 */
export function renderHeatmapSettings(
	containerEl: HTMLElement,
	plugin: PluginLike
): void {
	const sectionTitles = plugin.i18n.sectionTitles as Record<string, string>;
	const group = new SettingGroup({ title: sectionTitles.heatmap! });
	group.render(containerEl);
	const contentEl = group.getContentEl();
	if (!contentEl) return;

	// Heatmap max notes setting
	const sliderRenderer = new SliderSettingRenderer(1, 40, 1, plugin);
	const handleHeatmapMaxNotesChange = createSettingHandler({ plugin, settingKey: "heatmapMaxNotes" });
	sliderRenderer.render(contentEl, {
		name: ts(plugin, "heatmapMaxNotes", "name"),
		description: ts(plugin, "heatmapMaxNotes", "description"),
		value: plugin.settings.heatmapMaxNotes,
		onChange: handleHeatmapMaxNotesChange,
	});

	// Heatmap max words setting
	const numberRenderer = new NumberSettingRenderer(plugin, 1);
	const handleHeatmapMaxWordsChange = createSettingHandler({ plugin, settingKey: "heatmapMaxWords" });
	numberRenderer.render(contentEl, {
		name: ts(plugin, "heatmapMaxWords", "name"),
		description: ts(plugin, "heatmapMaxWords", "description"),
		value: plugin.settings.heatmapMaxWords,
		onChange: handleHeatmapMaxWordsChange,
	});

	// Heatmap hide date numbers setting
	const toggleRenderer = new ToggleSettingRenderer(plugin);
	const handleHeatmapHideDateNumbersChange = createSettingHandler({ plugin, settingKey: "heatmapHideDateNumbers" });
	toggleRenderer.render(contentEl, {
		name: ts(plugin, "heatmapHideDateNumbers", "name"),
		description: ts(plugin, "heatmapHideDateNumbers", "description"),
		value: plugin.settings.heatmapHideDateNumbers,
		onChange: handleHeatmapHideDateNumbersChange,
	});
}
