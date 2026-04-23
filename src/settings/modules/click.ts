import {Setting} from "obsidian";
import CalendarZ from "../../main";

/**
 * Renders click behavior settings.
 * @param containerEl - Container element
 * @param plugin - CalendarZ plugin instance
 */
export function renderClickSettings(containerEl: HTMLElement, plugin: CalendarZ): void {
	const t = plugin.i18n;
	const clickSettings = containerEl.createDiv({cls: "setting-group"});

	new Setting(clickSettings).setClass("setting-item-heading").setName(t.sectionTitles.click);

	const clickSettingsContent = clickSettings.createDiv({cls: "setting-items"});

	// Confirm before creating daily note setting
	new Setting(clickSettingsContent)
		.setName(t.settings.confirmBeforeCreate.name)
		.setDesc(t.settings.confirmBeforeCreate.description)
		.addToggle(toggle => toggle
			.setValue(plugin.settings.confirmBeforeCreate)
			.onChange(async (value) => {
				plugin.settings.confirmBeforeCreate = value;
				await plugin.saveSettings();
				plugin.refreshView();
			}));
}
