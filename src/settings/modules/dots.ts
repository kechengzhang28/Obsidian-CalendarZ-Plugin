import type { PluginLike } from "../../types";
import { SettingGroup } from "../ui/SettingGroup";
import { SliderSettingRenderer, NumberSettingRenderer } from "../ui/SettingRenderer";
import { createSettingHandler } from "../settingUtils";

/**
 * Renders dots chart settings (dot threshold).
 * @param containerEl - Container element
 * @param plugin - Plugin instance
 */
export function renderDotsSettings(
	containerEl: HTMLElement,
	plugin: PluginLike
): void {
	const t = plugin.i18n;

	const group = new SettingGroup({ title: t.sectionTitles.dots });
	group.render(containerEl);
	const contentEl = group.getContentEl();
	if (!contentEl) return;

	// Dot threshold setting (for note count mode)
	const sliderRenderer = new SliderSettingRenderer(1, 10, 1, plugin);
	const handleDotThresholdChange = createSettingHandler({ plugin, settingKey: "dotThreshold" });
	sliderRenderer.render(contentEl, {
		name: t.settings.dotThreshold.name,
		description: t.settings.dotThreshold.description,
		value: plugin.settings.dotThreshold,
		onChange: handleDotThresholdChange,
	});

	// Dot word threshold setting (for word count mode)
	const numberRenderer = new NumberSettingRenderer(plugin, 1);
	const handleDotWordThresholdChange = createSettingHandler({ plugin, settingKey: "dotWordThreshold" });
	numberRenderer.render(contentEl, {
		name: t.settings.dotWordThreshold.name,
		description: t.settings.dotWordThreshold.description,
		value: plugin.settings.dotWordThreshold,
		onChange: handleDotWordThresholdChange,
	});
}
