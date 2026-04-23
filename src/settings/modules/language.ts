import {Setting} from "obsidian";
import CalendarZ from "../../main";
import {Language} from "../types";

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
	const langSettings = containerEl.createDiv({cls: "setting-group"});
	const langSettingsContent = langSettings.createDiv({cls: "setting-items"});
	const t = plugin.i18n;

	new Setting(langSettingsContent)
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
