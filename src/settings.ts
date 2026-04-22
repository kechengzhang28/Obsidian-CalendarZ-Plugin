import {App, PluginSettingTab, Setting} from "obsidian";
import CalendarZ from "./main";

export type Language = "en-US" | "zh-CN";
export type MonthFormat = "numeric" | "short" | "long";
export type TitleFormat = "yearMonth" | "monthYear";
export type WeekStart = "sunday" | "monday";

export interface CalendarZSettings {
	language: Language;
	monthFormat: MonthFormat;
	titleFormat: TitleFormat;
	weekStart: WeekStart;
	ignoredFolders: string[];
	dateFieldName: string;
}

export const DEFAULT_SETTINGS: CalendarZSettings = {
	language: "en-US",
	monthFormat: "numeric",
	titleFormat: "monthYear",
	weekStart: "sunday",
	ignoredFolders: [],
	dateFieldName: "date"
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

		new Setting(containerEl)
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

		new Setting(containerEl)
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

		new Setting(containerEl)
			.setName(t.settings.dateFieldName.name)
			.setDesc(t.settings.dateFieldName.description)
			.addText(text => text
				.setPlaceholder("date")
				.setValue(this.plugin.settings.dateFieldName)
				.onChange(async (value) => {
					this.plugin.settings.dateFieldName = value.trim() || "date";
					await this.plugin.saveSettings();
					this.plugin.refreshView();
				}));

		// Ignored folders setting
		const ignoredFoldersSetting = new Setting(containerEl)
			.setName(t.settings.ignoredFolders.name)
			.setDesc(t.settings.ignoredFolders.description);

		// Display current ignored folders
		const foldersContainer = containerEl.createDiv("calendarz-ignored-folders");
		this.renderIgnoredFoldersList(foldersContainer);

		// Add new folder input
		new Setting(containerEl)
			.setName(t.settings.ignoredFolders.addButton)
			.addText(text => {
				text.setPlaceholder(t.settings.ignoredFolders.placeholder);
				text.inputEl.addClass("calendarz-folder-input");
				return text;
			})
			.addButton(button => {
				button.setButtonText(t.settings.ignoredFolders.addButton);
				button.onClick(async () => {
					const input = containerEl.querySelector(".calendarz-folder-input") as HTMLInputElement;
					const folderPath = input.value.trim();
					if (folderPath && !this.plugin.settings.ignoredFolders.includes(folderPath)) {
						this.plugin.settings.ignoredFolders.push(folderPath);
						await this.plugin.saveSettings();
						input.value = "";
						this.renderIgnoredFoldersList(foldersContainer);
						this.plugin.refreshView();
					}
				});
				return button;
			});
	}

	private renderIgnoredFoldersList(container: HTMLElement): void {
		container.empty();
		const t = this.plugin.i18n;

		if (this.plugin.settings.ignoredFolders.length === 0) {
			container.createEl("div", {
				text: t.settings.ignoredFolders.empty,
				cls: "calendarz-ignored-folders-empty"
			});
			return;
		}

		const list = container.createEl("ul", { cls: "calendarz-ignored-folders-list" });
		for (const folder of this.plugin.settings.ignoredFolders) {
			const item = list.createEl("li", { cls: "calendarz-ignored-folder-item" });
			item.createSpan({ text: folder, cls: "calendarz-folder-path" });

			const removeBtn = item.createEl("button", {
				text: t.settings.ignoredFolders.removeButton,
				cls: "calendarz-remove-folder-btn"
			});
			removeBtn.addEventListener("click", async () => {
				this.plugin.settings.ignoredFolders = this.plugin.settings.ignoredFolders.filter(f => f !== folder);
				await this.plugin.saveSettings();
				this.renderIgnoredFoldersList(container);
				this.plugin.refreshView();
			});
		}
	}
}
