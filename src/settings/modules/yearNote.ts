import type { PluginLike } from "../../core/types";
import { SettingGroup } from "../ui/SettingGroup";
import { ToggleSettingRenderer, TextSettingRenderer } from "../ui/SettingRenderer";
import { createSettingHandler, ts, getSectionTitle } from "../settingUtils";

/**
 * Renders year note settings.
 * @param containerEl - Container element
 * @param plugin - Plugin instance
 */
export function renderYearNoteSettings(containerEl: HTMLElement, plugin: PluginLike): void {
	const group = new SettingGroup({ title: getSectionTitle(plugin, "yearNote") });
	group.render(containerEl);
	const contentEl = group.getContentEl();
	if (!contentEl) return;

	// Year note enabled setting
	const yearNoteEnabledRenderer = new ToggleSettingRenderer(plugin);
	const handleYearNoteEnabledChange = createSettingHandler({ plugin, settingKey: "yearNoteEnabled" });
	yearNoteEnabledRenderer.render(contentEl, {
		name: ts(plugin, "yearNoteEnabled", "name"),
		description: ts(plugin, "yearNoteEnabled", "description"),
		value: plugin.settings.yearNoteEnabled,
		onChange: handleYearNoteEnabledChange,
	});

	// Year note template setting
	const yearNoteTemplateRenderer = new TextSettingRenderer(plugin, "templates/Yearly.md");
	const handleYearNoteTemplateChange = createSettingHandler({ plugin, settingKey: "yearNoteTemplate" });
	yearNoteTemplateRenderer.render(contentEl, {
		name: ts(plugin, "yearNoteTemplate", "name"),
		description: ts(plugin, "yearNoteTemplate", "description"),
		value: plugin.settings.yearNoteTemplate,
		onChange: handleYearNoteTemplateChange,
	});

	// Year note folder setting
	const yearNoteFolderRenderer = new TextSettingRenderer(plugin, "Yearly");
	const handleYearNoteFolderChange = createSettingHandler({ plugin, settingKey: "yearNoteFolder" });
	yearNoteFolderRenderer.render(contentEl, {
		name: ts(plugin, "yearNoteFolder", "name"),
		description: ts(plugin, "yearNoteFolder", "description"),
		value: plugin.settings.yearNoteFolder,
		onChange: handleYearNoteFolderChange,
	});

	// Year note format setting
	const yearNoteFormatRenderer = new TextSettingRenderer(plugin, "YYYY");
	const handleYearNoteFormatChange = createSettingHandler({ plugin, settingKey: "yearNoteFormat" });
	yearNoteFormatRenderer.render(contentEl, {
		name: ts(plugin, "yearNoteFormat", "name"),
		description: ts(plugin, "yearNoteFormat", "description"),
		value: plugin.settings.yearNoteFormat,
		onChange: handleYearNoteFormatChange,
	});
}
