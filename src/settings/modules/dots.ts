import type { PluginLike } from "../../core/types";
import { SettingGroup } from "../ui/SettingGroup";
import { SliderSettingRenderer, NumberSettingRenderer } from "../ui/SettingRenderer";
import { createSettingHandler } from "../settingUtils";

/** Helper to get nested i18n string values */
function ts(plugin: PluginLike, section: string, key: string): string {
	return ((plugin.i18n.settings as Record<string, Record<string, string>>)[section]!)[key]!;
}

/**
 * Renders dots chart settings (dot threshold).
 * @param containerEl - Container element
 * @param plugin - Plugin instance
 */
export function renderDotsSettings(
	containerEl: HTMLElement,
	plugin: PluginLike
): void {
	const sectionTitles = plugin.i18n.sectionTitles as Record<string, string>;
	const group = new SettingGroup({ title: sectionTitles.dots! });
	group.render(containerEl);
	const contentEl = group.getContentEl();
	if (!contentEl) return;

	// Dot threshold setting (for note count mode)
	const sliderRenderer = new SliderSettingRenderer(1, 10, 1, plugin);
	const handleDotThresholdChange = createSettingHandler({ plugin, settingKey: "dotThreshold" });
	sliderRenderer.render(contentEl, {
		name: ts(plugin, "dotThreshold", "name"),
		description: ts(plugin, "dotThreshold", "description"),
		value: plugin.settings.dotThreshold,
		onChange: handleDotThresholdChange,
	});

	// Dot word threshold setting (for word count mode)
	const numberRenderer = new NumberSettingRenderer(plugin, 1);
	const handleDotWordThresholdChange = createSettingHandler({ plugin, settingKey: "dotWordThreshold" });
	numberRenderer.render(contentEl, {
		name: ts(plugin, "dotWordThreshold", "name"),
		description: ts(plugin, "dotWordThreshold", "description"),
		value: plugin.settings.dotWordThreshold,
		onChange: handleDotWordThresholdChange,
	});
}
