import {App, PluginSettingTab, Setting} from "obsidian";
import CalendarZ from "./main";

export type Language = "en-US" | "zh-CN";
export type MonthFormat = "numeric" | "short" | "long";

export interface CalendarZSettings {
	language: Language;
	monthFormat: MonthFormat;
}

export const DEFAULT_SETTINGS: CalendarZSettings = {
	language: "en-US",
	monthFormat: "numeric"
};

export class CalendarZSettingTab extends PluginSettingTab {
	plugin: CalendarZ;

	constructor(app: App, plugin: CalendarZ) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		const t = this.plugin.i18n;

		new Setting(containerEl)
			.setName(t.settings.language.name)
			.setDesc(t.settings.language.description)
			.addDropdown(dropdown => dropdown
				.addOption("en-US", "English")
				.addOption("zh-CN", "中文")
				.setValue(this.plugin.settings.language)
				.onChange(async (value) => {
					this.plugin.settings.language = value as Language;
					await this.plugin.saveSettings();
					this.plugin.loadI18n();
					this.display();
					this.plugin.refreshView();
				}));

		new Setting(containerEl)
			.setName(t.settings.monthFormat.name)
			.setDesc(t.settings.monthFormat.description)
			.addDropdown(dropdown => dropdown
				.addOption("numeric", t.settings.monthFormat.options.numeric)
				.addOption("short", t.settings.monthFormat.options.short)
				.addOption("long", t.settings.monthFormat.options.long)
				.setValue(this.plugin.settings.monthFormat)
				.onChange(async (value) => {
					this.plugin.settings.monthFormat = value as MonthFormat;
					await this.plugin.saveSettings();
					this.plugin.refreshView();
				}));
	}
}
