import type { PluginLike } from "../../core/types";
import { SettingGroup } from "../ui/SettingGroup";
import { ToggleSettingRenderer, TextSettingRenderer } from "../ui/SettingRenderer";
import { createSettingHandler, ts, getSectionTitle } from "../settingUtils";

/**
 * Renders week note settings.
 * @param containerEl - Container element
 * @param plugin - Plugin instance
 */
export function renderWeekNoteSettings(containerEl: HTMLElement, plugin: PluginLike): void {
	const group = new SettingGroup({ title: getSectionTitle(plugin, "weekNote") });
	group.render(containerEl);
	const contentEl = group.getContentEl();
	if (!contentEl) return;

	// Week note enabled setting
	const weekNoteEnabledRenderer = new ToggleSettingRenderer(plugin);
	const handleWeekNoteEnabledChange = createSettingHandler({ plugin, settingKey: "weekNoteEnabled" });
	weekNoteEnabledRenderer.render(contentEl, {
		name: ts(plugin, "weekNoteEnabled", "name"),
		description: ts(plugin, "weekNoteEnabled", "description"),
		value: plugin.settings.weekNoteEnabled,
		onChange: handleWeekNoteEnabledChange,
	});

	// Week note template setting
	const weekNoteTemplateRenderer = new TextSettingRenderer(plugin, "templates/Weekly.md");
	const handleWeekNoteTemplateChange = createSettingHandler({ plugin, settingKey: "weekNoteTemplate" });
	weekNoteTemplateRenderer.render(contentEl, {
		name: ts(plugin, "weekNoteTemplate", "name"),
		description: ts(plugin, "weekNoteTemplate", "description"),
		value: plugin.settings.weekNoteTemplate,
		onChange: handleWeekNoteTemplateChange,
	});

	// Week note folder setting
	const weekNoteFolderRenderer = new TextSettingRenderer(plugin, "Weekly");
	const handleWeekNoteFolderChange = createSettingHandler({ plugin, settingKey: "weekNoteFolder" });
	weekNoteFolderRenderer.render(contentEl, {
		name: ts(plugin, "weekNoteFolder", "name"),
		description: ts(plugin, "weekNoteFolder", "description"),
		value: plugin.settings.weekNoteFolder,
		onChange: handleWeekNoteFolderChange,
	});

	// Week note format setting
	const weekNoteFormatRenderer = new TextSettingRenderer(plugin, "YYYY-[W]WW");
	const handleWeekNoteFormatChange = createSettingHandler({ plugin, settingKey: "weekNoteFormat" });
	weekNoteFormatRenderer.render(contentEl, {
		name: ts(plugin, "weekNoteFormat", "name"),
		description: ts(plugin, "weekNoteFormat", "description"),
		value: plugin.settings.weekNoteFormat,
		onChange: handleWeekNoteFormatChange,
	});
}
