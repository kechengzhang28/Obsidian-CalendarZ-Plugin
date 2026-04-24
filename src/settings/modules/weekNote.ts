import type { PluginLike } from "../../types";
import { SettingGroup } from "../ui/SettingGroup";
import { ToggleSettingRenderer, TextSettingRenderer } from "../ui/SettingRenderer";
import { createSettingHandler } from "../settingUtils";

/**
 * Renders week note settings.
 * @param containerEl - Container element
 * @param plugin - Plugin instance
 */
export function renderWeekNoteSettings(containerEl: HTMLElement, plugin: PluginLike): void {
	const t = plugin.i18n;

	const group = new SettingGroup({ title: t.sectionTitles.weekNote });
	group.render(containerEl);
	const contentEl = group.getContentEl();
	if (!contentEl) return;

	// Week note enabled setting
	const weekNoteEnabledRenderer = new ToggleSettingRenderer(plugin);
	const handleWeekNoteEnabledChange = createSettingHandler({ plugin, settingKey: "weekNoteEnabled" });
	weekNoteEnabledRenderer.render(contentEl, {
		name: t.settings.weekNoteEnabled.name,
		description: t.settings.weekNoteEnabled.description,
		value: plugin.settings.weekNoteEnabled,
		onChange: handleWeekNoteEnabledChange,
	});

	// Week note template setting
	const weekNoteTemplateRenderer = new TextSettingRenderer(plugin, "templates/Weekly.md");
	const handleWeekNoteTemplateChange = createSettingHandler({ plugin, settingKey: "weekNoteTemplate" });
	weekNoteTemplateRenderer.render(contentEl, {
		name: t.settings.weekNoteTemplate.name,
		description: t.settings.weekNoteTemplate.description,
		value: plugin.settings.weekNoteTemplate,
		onChange: handleWeekNoteTemplateChange,
	});

	// Week note folder setting
	const weekNoteFolderRenderer = new TextSettingRenderer(plugin, "Weekly");
	const handleWeekNoteFolderChange = createSettingHandler({ plugin, settingKey: "weekNoteFolder" });
	weekNoteFolderRenderer.render(contentEl, {
		name: t.settings.weekNoteFolder.name,
		description: t.settings.weekNoteFolder.description,
		value: plugin.settings.weekNoteFolder,
		onChange: handleWeekNoteFolderChange,
	});

	// Week note format setting
	const weekNoteFormatRenderer = new TextSettingRenderer(plugin, t.settings.weekNoteFormat.placeholder);
	const handleWeekNoteFormatChange = createSettingHandler({ plugin, settingKey: "weekNoteFormat" });
	weekNoteFormatRenderer.render(contentEl, {
		name: t.settings.weekNoteFormat.name,
		description: t.settings.weekNoteFormat.description,
		value: plugin.settings.weekNoteFormat,
		onChange: handleWeekNoteFormatChange,
	});
}
