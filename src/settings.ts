import {App, PluginSettingTab, Setting} from "obsidian";
import CalendarZ from "./main";

export interface CalendarZSettings {
	mySetting: string;
}

export interface CalendarZSettings {
	mySetting: string;
}
export const DEFAULT_SETTINGS: CalendarZSettings = {
	mySetting: 'default'
}

export class CalendarZSettingTab extends PluginSettingTab {
	plugin: CalendarZ;

	constructor(app: App, plugin: CalendarZ) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Settings #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
