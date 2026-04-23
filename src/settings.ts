import {App, PluginSettingTab, Setting} from "obsidian";
import CalendarZ from "./main";
import {IgnoredFoldersModal} from "./ui/IgnoredFoldersModal";

/** Supported display languages */
export type Language = "en-US" | "zh-CN";
/** Month display format options */
export type MonthFormat = "numeric" | "short" | "long";
/** Header title format options */
export type TitleFormat = "yearMonth" | "monthYear";
/** Week start day options */
export type WeekStart = "sunday" | "monday";
/** Date source options for extracting dates from notes */
export type DateSource = "yaml" | "filename";
/** Display mode options for note statistics */
export type DisplayMode = "none" | "dots" | "heatmap";

/**
 * Plugin settings interface.
 * Contains all user-configurable options for the CalendarZ plugin.
 */
export interface CalendarZSettings {
	/** Display language */
	language: Language;
	/** Month display format */
	monthFormat: MonthFormat;
	/** Header title format */
	titleFormat: TitleFormat;
	/** Week start day */
	weekStart: WeekStart;
	/** List of folder paths to ignore when counting notes */
	ignoredFolders: string[];
	/** YAML frontmatter field name for date extraction */
	dateFieldName: string;
	/** Source of date data (YAML frontmatter or filename) */
	dateSource: DateSource;
	/** Date format pattern for filename extraction (e.g., "YYYY-MM-DD") */
	filenameDateFormat: string;
	/** Display mode for note statistics: heatmap, dots, or none */
	displayMode: DisplayMode;
	/** Number of notes each dot represents (for dots mode) */
	dotThreshold: number;
}

/** Default settings values */
export const DEFAULT_SETTINGS: CalendarZSettings = {
	language: "en-US",
	monthFormat: "numeric",
	titleFormat: "monthYear",
	weekStart: "sunday",
	ignoredFolders: [],
	dateFieldName: "date",
	dateSource: "yaml",
	filenameDateFormat: "YYYY-MM-DD",
	displayMode: "none",
	dotThreshold: 1
};

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

		const t = this.plugin.i18n;

		const langSettings = containerEl.createDiv({ cls: "setting-group" })
		const langSettingsContent = langSettings.createDiv({ cls: "setting-items" })
		// Language setting
		new Setting(langSettingsContent)
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


		const basicSettings = containerEl.createDiv({ cls: "setting-group" })
		new Setting(basicSettings).setClass('setting-item-heading').setName(t.sectionTitles.basic);

		const basicSettingsContent = basicSettings.createDiv({ cls: "setting-items" });

		// Month format setting
		new Setting(basicSettingsContent)
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

		// Title format setting
		new Setting(basicSettingsContent)
			.setName(t.settings.titleFormat.name)
			.setDesc(t.settings.titleFormat.description)
			.addDropdown(dropdown => dropdown
				.addOption("yearMonth", t.settings.titleFormat.options.yearMonth)
				.addOption("monthYear", t.settings.titleFormat.options.monthYear)
				.setValue(this.plugin.settings.titleFormat)
				.onChange(async (value) => {
					this.plugin.settings.titleFormat = value as TitleFormat;
					await this.plugin.saveSettings();
					this.plugin.refreshView();
				}));

		// Week start setting
		new Setting(basicSettingsContent)
			.setName(t.settings.weekStart.name)
			.setDesc(t.settings.weekStart.description)
			.addDropdown(dropdown => dropdown
				.addOption("sunday", t.settings.weekStart.options.sunday)
				.addOption("monday", t.settings.weekStart.options.monday)
				.setValue(this.plugin.settings.weekStart)
				.onChange(async (value) => {
					this.plugin.settings.weekStart = value as WeekStart;
					await this.plugin.saveSettings();
					this.plugin.refreshView();
				}));

		const statSetting = containerEl.createDiv({ cls: "setting-group" })
		new Setting(statSetting).setClass('setting-item-heading').setName(t.sectionTitles.statistics);

		const statSettingContent = statSetting.createDiv({ cls: "setting-items" });

		// Display mode setting
		new Setting(statSettingContent)
			.setName(t.settings.displayMode.name)
			.setDesc(t.settings.displayMode.description)
			.addDropdown(dropdown => dropdown
				.addOption("none", t.settings.displayMode.options.none)
				.addOption("dots", t.settings.displayMode.options.dots)
				.addOption("heatmap", t.settings.displayMode.options.heatmap)
				.setValue(this.plugin.settings.displayMode)
				.onChange(async (value) => {
					this.plugin.settings.displayMode = value as DisplayMode;
					await this.plugin.saveSettings();
					this.display();
					this.plugin.refreshView();
				}));

		// Dot threshold setting (only shown when displayMode is "dots")
		if (this.plugin.settings.displayMode === "dots") {
			new Setting(statSettingContent)
				.setName(t.settings.dotThreshold.name)
				.setDesc(t.settings.dotThreshold.description)
				.addSlider(slider => slider
					.setLimits(1, 10, 1)
					.setValue(this.plugin.settings.dotThreshold)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.dotThreshold = value;
						await this.plugin.saveSettings();
						this.plugin.refreshView();
					}));
		}

		// Date field name setting (for YAML source)
		new Setting(statSettingContent)
			.setName(t.settings.dateFieldName.name)
			.setDesc(t.settings.dateFieldName.description)
			.addText(text => text
				.setPlaceholder("Date")
				.setValue(this.plugin.settings.dateFieldName)
				.onChange((value) => {
					void (async () => {
						this.plugin.settings.dateFieldName = value.trim() || "date";
						await this.plugin.saveSettings();
						this.plugin.refreshView();
					})();
				}));

		// Date source setting
		new Setting(statSettingContent)
			.setName(t.settings.dateSource.name)
			.setDesc(t.settings.dateSource.description)
			.addDropdown(dropdown => dropdown
				.addOption("yaml", t.settings.dateSource.options.yaml)
				.addOption("filename", t.settings.dateSource.options.filename)
				.setValue(this.plugin.settings.dateSource)
				.onChange(async (value) => {
					this.plugin.settings.dateSource = value as DateSource;
					await this.plugin.saveSettings();
					this.display();
					this.plugin.refreshView();
				}));

		// Filename date format setting (only shown when dateSource is "filename")
		if (this.plugin.settings.dateSource === "filename") {
			new Setting(statSettingContent)
				.setName(t.settings.filenameDateFormat.name)
				.setDesc(t.settings.filenameDateFormat.description)
				.addText(text => text
					// eslint-disable-next-line obsidianmd/ui/sentence-case
					.setPlaceholder("YYYY-MM-DD")
					.setValue(this.plugin.settings.filenameDateFormat)
					.onChange((value) => {
						void (async () => {
							this.plugin.settings.filenameDateFormat = value.trim() || "YYYY-MM-DD";
							await this.plugin.saveSettings();
							this.plugin.refreshView();
						})();
					}));
		}

		// Ignored folders setting
		const ignoredFoldersDesc = this.getIgnoredFoldersDescription();
		new Setting(statSettingContent)
			.setName(t.settings.ignoredFolders.name)
			.setDesc(ignoredFoldersDesc)
			.addButton(button => {
				button.setButtonText(t.settings.ignoredFolders.manageButton || "Manage");
				button.onClick(() => {
					const modal = new IgnoredFoldersModal(
						this.app,
						this.plugin.settings.ignoredFolders,
						this.plugin.i18n,
						async (folders) => {
							this.plugin.settings.ignoredFolders = folders;
							await this.plugin.saveSettings();
							this.display();
							this.plugin.refreshView();
						}
					);
					modal.open();
				});
				return button;
			});
	}

	/**
	 * Generates a description element showing the currently ignored folders.
	 * @returns DocumentFragment with description and bullet list
	 */
	private getIgnoredFoldersDescription(): DocumentFragment {
		const t = this.plugin.i18n.settings.ignoredFolders;
		const fragment = document.createDocumentFragment();

		// Add description text
		fragment.appendText(t.description);

		if (this.plugin.settings.ignoredFolders.length > 0) {
			// Add line break
			fragment.appendChild(document.createElement("br"));

			// Add each folder as a bullet point with line break
			for (let i = 0; i < this.plugin.settings.ignoredFolders.length; i++) {
				const folder = this.plugin.settings.ignoredFolders[i];
				const line = document.createElement("div");
				line.addClass("calendarz-settings-folder-item");
				line.textContent = `• ${folder}`;
				fragment.appendChild(line);
			}
		}

		return fragment;
	}

}
