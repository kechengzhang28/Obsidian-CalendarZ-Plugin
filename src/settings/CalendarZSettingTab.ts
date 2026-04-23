import {App, PluginSettingTab} from "obsidian";
import CalendarZ from "../main";
import {renderLanguageSettings} from "./modules/language";
import {renderBasicSettings} from "./modules/basic";
import {renderStatisticsSettings} from "./modules/statistics";

/**
 * Settings tab for the CalendarZ plugin.
 * Provides UI for configuring all plugin settings.
 */
export class CalendarZSettingTab extends PluginSettingTab {
	/** Reference to the main plugin instance */
	plugin: CalendarZ;

	/**
	 * Creates a new settings tab instance.
	 * @param app - Obsidian App instance
	 * @param plugin - CalendarZ plugin instance
	 */
	constructor(app: App, plugin: CalendarZ) {
		super(app, plugin);
		this.plugin = plugin;
	}

	/**
	 * Renders the settings UI.
	 */
	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		renderLanguageSettings(containerEl, this.plugin, () => this.display());
		renderBasicSettings(containerEl, this.plugin);
		renderStatisticsSettings(containerEl, this.plugin, this.app, () => this.display());
	}
}
