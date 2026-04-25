import type { PluginLike } from "../../core/types";
import { SettingGroup } from "../ui/SettingGroup";
import { ToggleSettingRenderer, TextSettingRenderer } from "../ui/SettingRenderer";
import { createSettingHandler, ts, getSectionTitle } from "../settingUtils";

/**
 * Renders month note settings.
 * @param containerEl - Container element
 * @param plugin - Plugin instance
 */
export function renderMonthNoteSettings(containerEl: HTMLElement, plugin: PluginLike): void {
	const group = new SettingGroup({ title: getSectionTitle(plugin, "monthNote") });
	group.render(containerEl);
	const contentEl = group.getContentEl();
	if (!contentEl) return;

	// Month note enabled setting
	const monthNoteEnabledRenderer = new ToggleSettingRenderer(plugin);
	const handleMonthNoteEnabledChange = createSettingHandler({ plugin, settingKey: "monthNoteEnabled" });
	monthNoteEnabledRenderer.render(contentEl, {
		name: ts(plugin, "monthNoteEnabled", "name"),
		description: ts(plugin, "monthNoteEnabled", "description"),
		value: plugin.settings.monthNoteEnabled,
		onChange: handleMonthNoteEnabledChange,
	});

	// Month note template setting
	const monthNoteTemplateRenderer = new TextSettingRenderer(plugin, "templates/Monthly.md");
	const handleMonthNoteTemplateChange = createSettingHandler({ plugin, settingKey: "monthNoteTemplate" });
	monthNoteTemplateRenderer.render(contentEl, {
		name: ts(plugin, "monthNoteTemplate", "name"),
		description: ts(plugin, "monthNoteTemplate", "description"),
		value: plugin.settings.monthNoteTemplate,
		onChange: handleMonthNoteTemplateChange,
	});

	// Month note folder setting
	const monthNoteFolderRenderer = new TextSettingRenderer(plugin, "Monthly");
	const handleMonthNoteFolderChange = createSettingHandler({ plugin, settingKey: "monthNoteFolder" });
	monthNoteFolderRenderer.render(contentEl, {
		name: ts(plugin, "monthNoteFolder", "name"),
		description: ts(plugin, "monthNoteFolder", "description"),
		value: plugin.settings.monthNoteFolder,
		onChange: handleMonthNoteFolderChange,
	});

	// Month note format setting
	const monthNoteFormatRenderer = new TextSettingRenderer(plugin, "YYYY-MM");
	const handleMonthNoteFormatChange = createSettingHandler({ plugin, settingKey: "monthNoteFormat" });
	monthNoteFormatRenderer.render(contentEl, {
		name: ts(plugin, "monthNoteFormat", "name"),
		description: ts(plugin, "monthNoteFormat", "description"),
		value: plugin.settings.monthNoteFormat,
		onChange: handleMonthNoteFormatChange,
	});
}
