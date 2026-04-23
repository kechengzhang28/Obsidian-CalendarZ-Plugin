import { Setting } from "obsidian";
import type { PluginLike } from "../../types";
import type { Language } from "../types";
import { SettingGroup } from "../ui/SettingGroup";
import { createSettingHandler } from "../settingUtils";

/**
 * Renders language settings.
 * @param containerEl - Container element
 * @param plugin - Plugin instance
 * @param refreshDisplay - Callback to refresh the settings display
 */
export function renderLanguageSettings(
	containerEl: HTMLElement,
	plugin: PluginLike,
	refreshDisplay: () => void
): void {
	const group = new SettingGroup({ title: "" });
	group.render(containerEl);
	const contentEl = group.getContentEl();
	if (!contentEl) return;

	const t = plugin.i18n;

	// Language setting with special handling (needs to reload i18n)
	const handleLanguageChange = createSettingHandler({
		plugin,
		settingKey: "language",
		postSave: () => {
			plugin.loadI18n();
			refreshDisplay();
		},
	});

	new Setting(contentEl)
		.setName(t.settings.language.name)
		.setDesc(t.settings.language.description)
		.addDropdown(dropdown => dropdown
			.addOption("en-US", "English")
			.addOption("zh-CN", "中文")
			.setValue(plugin.settings.language)
			.onChange(async (value) => {
				await handleLanguageChange(value as Language);
			}));

	// Open calendar button
	new Setting(contentEl)
		.setName(t.settings.openCalendar.name)
		.setDesc(t.settings.openCalendar.description)
		.addButton(button => button
			.setButtonText(t.settings.openCalendar.buttonText)
			.onClick(() => {
				void plugin.activateView();
			}));

	// Refresh plugin button
	new Setting(contentEl)
		.setName(t.settings.refreshPlugin.name)
		.setDesc(t.settings.refreshPlugin.description)
		.addButton(button => button
			.setButtonText(t.settings.refreshPlugin.buttonText)
			.onClick(() => {
				plugin.refreshView();
			}));
}
