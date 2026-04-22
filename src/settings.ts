import {App, PluginSettingTab, Setting} from "obsidian";
import CalendarZ from "./main";

export interface CalendarZSettings {
	showOnStartup: boolean;
}

export const DEFAULT_SETTINGS: CalendarZSettings = {
	showOnStartup: false
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

		containerEl.createEl("h2", { text: "CalendarZ Settings" });

		new Setting(containerEl)
			.setName('Show heatmap on startup')
			.setDesc('Automatically display the note heatmap in the right sidebar when Obsidian starts')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showOnStartup)
				.onChange(async (value) => {
					this.plugin.settings.showOnStartup = value;
					await this.plugin.saveSettings();
				}));
	}
}
