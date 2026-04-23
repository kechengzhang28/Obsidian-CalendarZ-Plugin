import {Setting} from "obsidian";
import CalendarZ from "../../main";
import {MonthFormat, TitleFormat, WeekStart} from "../types";

/**
 * Renders basic settings (month format, title format, week start).
 * @param containerEl - Container element
 * @param plugin - CalendarZ plugin instance
 */
export function renderBasicSettings(containerEl: HTMLElement, plugin: CalendarZ): void {
	const t = plugin.i18n;
	const basicSettings = containerEl.createDiv({cls: "setting-group"});

	new Setting(basicSettings).setClass("setting-item-heading").setName(t.sectionTitles.basic);

	const basicSettingsContent = basicSettings.createDiv({cls: "setting-items"});

	// Month format setting
	new Setting(basicSettingsContent)
		.setName(t.settings.monthFormat.name)
		.setDesc(t.settings.monthFormat.description)
		.addDropdown(dropdown => dropdown
			.addOption("numeric", t.settings.monthFormat.options.numeric)
			.addOption("short", t.settings.monthFormat.options.short)
			.addOption("long", t.settings.monthFormat.options.long)
			.setValue(plugin.settings.monthFormat)
			.onChange(async (value) => {
				plugin.settings.monthFormat = value as MonthFormat;
				await plugin.saveSettings();
				plugin.refreshView();
			}));

	// Title format setting
	new Setting(basicSettingsContent)
		.setName(t.settings.titleFormat.name)
		.setDesc(t.settings.titleFormat.description)
		.addDropdown(dropdown => dropdown
			.addOption("yearMonth", t.settings.titleFormat.options.yearMonth)
			.addOption("monthYear", t.settings.titleFormat.options.monthYear)
			.setValue(plugin.settings.titleFormat)
			.onChange(async (value) => {
				plugin.settings.titleFormat = value as TitleFormat;
				await plugin.saveSettings();
				plugin.refreshView();
			}));

	// Week start setting
	new Setting(basicSettingsContent)
		.setName(t.settings.weekStart.name)
		.setDesc(t.settings.weekStart.description)
		.addDropdown(dropdown => dropdown
			.addOption("sunday", t.settings.weekStart.options.sunday)
			.addOption("monday", t.settings.weekStart.options.monday)
			.setValue(plugin.settings.weekStart)
			.onChange(async (value) => {
				plugin.settings.weekStart = value as WeekStart;
				await plugin.saveSettings();
				plugin.refreshView();
			}));
}
