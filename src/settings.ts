import {App, PluginSettingTab, Setting} from "obsidian";
import CalendarZ from "./main";

export type Language = "en" | "zh";

export interface CalendarZSettings {
	language: Language;
}

export const DEFAULT_SETTINGS: CalendarZSettings = {
	language: "en"
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
				.addOption("en", "English")
				.addOption("zh", "中文")
				.setValue(this.plugin.settings.language)
				.onChange(async (value) => {
					this.plugin.settings.language = value as Language;
					await this.plugin.saveSettings();
					this.plugin.loadI18n();
					this.display();
					this.plugin.refreshView();
				}));
	}
}
