import {App, Plugin, PluginSettingTab} from "obsidian";
import type { PluginLike } from "../core/types";
import {renderLanguageSettings} from "./modules/language";
import {renderBasicSettings} from "./modules/basic";
import {renderStatisticsSettings} from "./modules/statistics";
import {renderDotsSettings} from "./modules/dots";
import {renderHeatmapSettings} from "./modules/heatmap";
import {renderClickSettings} from "./modules/click";
import {renderWeekNoteSettings} from "./modules/weekNote";
import {renderMonthNoteSettings} from "./modules/monthNote";
import {renderYearNoteSettings} from "./modules/yearNote";

/**
 * Settings tab for the CalendarZ plugin.
 * Provides UI for configuring all plugin settings.
 */
export class CalendarZSettingTab extends PluginSettingTab {
	plugin: PluginLike;

	constructor(app: App, plugin: PluginLike) {
		super(app, plugin as unknown as Plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		renderLanguageSettings(containerEl, this.plugin, () => this.display());
		renderBasicSettings(containerEl, this.plugin);
		renderStatisticsSettings(containerEl, this.plugin, this.app);
		renderDotsSettings(containerEl, this.plugin);
		renderHeatmapSettings(containerEl, this.plugin);
		renderClickSettings(containerEl, this.plugin);
		renderWeekNoteSettings(containerEl, this.plugin);
		renderMonthNoteSettings(containerEl, this.plugin);
		renderYearNoteSettings(containerEl, this.plugin);
	}
}
