import {App, Setting} from "obsidian";
import CalendarZ from "../../main";
import {IgnoredFoldersModal} from "../../ui/IgnoredFoldersModal";
import {DateSource, DisplayMode} from "../types";

/**
 * Renders statistics settings (display mode, dot threshold, date source, etc.).
 * @param containerEl - Container element
 * @param plugin - CalendarZ plugin instance
 * @param app - Obsidian App instance
 * @param refreshDisplay - Callback to refresh the settings display
 */
export function renderStatisticsSettings(
	containerEl: HTMLElement,
	plugin: CalendarZ,
	app: App,
	refreshDisplay: () => void
): void {
	const t = plugin.i18n;
	const statSetting = containerEl.createDiv({cls: "setting-group"});

	new Setting(statSetting).setClass("setting-item-heading").setName(t.sectionTitles.statistics);

	const statSettingContent = statSetting.createDiv({cls: "setting-items"});

	// Display mode setting
	new Setting(statSettingContent)
		.setName(t.settings.displayMode.name)
		.setDesc(t.settings.displayMode.description)
		.addDropdown(dropdown => dropdown
			.addOption("none", t.settings.displayMode.options.none)
			.addOption("dots", t.settings.displayMode.options.dots)
			.addOption("heatmap", t.settings.displayMode.options.heatmap)
			.setValue(plugin.settings.displayMode)
			.onChange(async (value) => {
				plugin.settings.displayMode = value as DisplayMode;
				await plugin.saveSettings();
				refreshDisplay();
				plugin.refreshView();
			}));

	// Dot threshold setting (only shown when displayMode is "dots")
	if (plugin.settings.displayMode === "dots") {
		new Setting(statSettingContent)
			.setName(t.settings.dotThreshold.name)
			.setDesc(t.settings.dotThreshold.description)
			.addSlider(slider => slider
				.setLimits(1, 10, 1)
				.setValue(plugin.settings.dotThreshold)
				.setDynamicTooltip()
				.onChange(async (value) => {
					plugin.settings.dotThreshold = value;
					await plugin.saveSettings();
					plugin.refreshView();
				}));
	}

	// Date field name setting (for YAML source)
	new Setting(statSettingContent)
		.setName(t.settings.dateFieldName.name)
		.setDesc(t.settings.dateFieldName.description)
		.addText(text => text
			.setPlaceholder("Date")
			.setValue(plugin.settings.dateFieldName)
			.onChange((value) => {
				void (async () => {
					plugin.settings.dateFieldName = value.trim() || "date";
					await plugin.saveSettings();
					plugin.refreshView();
				})();
			}));

	// Date source setting
	new Setting(statSettingContent)
		.setName(t.settings.dateSource.name)
		.setDesc(t.settings.dateSource.description)
		.addDropdown(dropdown => dropdown
			.addOption("yaml", t.settings.dateSource.options.yaml)
			.addOption("filename", t.settings.dateSource.options.filename)
			.setValue(plugin.settings.dateSource)
			.onChange(async (value) => {
				plugin.settings.dateSource = value as DateSource;
				await plugin.saveSettings();
				refreshDisplay();
				plugin.refreshView();
			}));

	// Filename date format setting (only shown when dateSource is "filename")
	if (plugin.settings.dateSource === "filename") {
		new Setting(statSettingContent)
			.setName(t.settings.filenameDateFormat.name)
			.setDesc(t.settings.filenameDateFormat.description)
			.addText(text => text
				// eslint-disable-next-line obsidianmd/ui/sentence-case
				.setPlaceholder("YYYY-MM-DD")
				.setValue(plugin.settings.filenameDateFormat)
				.onChange((value) => {
					void (async () => {
						plugin.settings.filenameDateFormat = value.trim() || "YYYY-MM-DD";
						await plugin.saveSettings();
						plugin.refreshView();
					})();
				}));
	}

	// Ignored folders setting
	const ignoredFoldersDesc = getIgnoredFoldersDescription(plugin);
	new Setting(statSettingContent)
		.setName(t.settings.ignoredFolders.name)
		.setDesc(ignoredFoldersDesc)
		.addButton(button => {
			button.setButtonText(t.settings.ignoredFolders.manageButton || "Manage");
			button.onClick(() => {
				const modal = new IgnoredFoldersModal(
					app,
					plugin.settings.ignoredFolders,
					plugin.i18n,
					async (folders) => {
						plugin.settings.ignoredFolders = folders;
						await plugin.saveSettings();
						refreshDisplay();
						plugin.refreshView();
					}
				);
				modal.open();
			});
			return button;
		});
}

/**
 * Generates a description element showing the currently ignored folders.
 * @param plugin - CalendarZ plugin instance
 * @returns DocumentFragment with description and bullet list
 */
function getIgnoredFoldersDescription(plugin: CalendarZ): DocumentFragment {
	const t = plugin.i18n.settings.ignoredFolders;
	const fragment = document.createDocumentFragment();

	fragment.appendText(t.description);

	if (plugin.settings.ignoredFolders.length > 0) {
		fragment.appendChild(document.createElement("br"));

		for (let i = 0; i < plugin.settings.ignoredFolders.length; i++) {
			const folder = plugin.settings.ignoredFolders[i];
			const line = document.createElement("div");
			line.addClass("calendarz-settings-folder-item");
			line.textContent = `• ${folder}`;
			fragment.appendChild(line);
		}
	}

	return fragment;
}
