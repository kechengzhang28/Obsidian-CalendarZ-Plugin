import { Setting } from "obsidian";
import CalendarZ from "../../main";
import { Language } from "../types";
import { SettingGroup } from "../../ui/components/SettingGroup";

/**
 * Renders language settings.
 * @param containerEl - Container element
 * @param plugin - CalendarZ plugin instance
 * @param refreshDisplay - Callback to refresh the settings display
 */
export function renderLanguageSettings(
	containerEl: HTMLElement,
	plugin: CalendarZ,
	refreshDisplay: () => void
): void {
	const group = new SettingGroup({ title: "" });
	group.render(containerEl);
	const contentEl = group.getContentEl();
	if (!contentEl) return;

	const t = plugin.i18n;

	new Setting(contentEl)
		.setName(t.settings.language.name)
		.setDesc(t.settings.language.description)
		.addDropdown(dropdown => dropdown
			.addOption("en-US", "English")
			.addOption("zh-CN", "中文")
			.setValue(plugin.settings.language)
			.onChange(async (value) => {
				plugin.settings.language = value as Language;
				await plugin.saveSettings();
				plugin.loadI18n();
				refreshDisplay();
				plugin.refreshView();
			}));
}
