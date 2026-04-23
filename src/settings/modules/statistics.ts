import { App, Setting } from "obsidian";
import CalendarZ from "../../main";
import { IgnoredFoldersModal } from "../../ui/IgnoredFoldersModal";
import { DateSource, DisplayMode } from "../types";
import { SettingGroup } from "../../ui/components/SettingGroup";
import {
	DropdownSettingRenderer,
	SliderSettingRenderer,
	TextSettingRenderer,
} from "../ui/SettingRenderer";

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

	const group = new SettingGroup({ title: t.sectionTitles.statistics });
	group.render(containerEl);
	const contentEl = group.getContentEl();
	if (!contentEl) return;

	// Display mode setting
	const displayModeRenderer = new DropdownSettingRenderer<DisplayMode>(plugin, {
		none: t.settings.displayMode.options.none,
		dots: t.settings.displayMode.options.dots,
		heatmap: t.settings.displayMode.options.heatmap,
	});
	displayModeRenderer.render(contentEl, {
		name: t.settings.displayMode.name,
		description: t.settings.displayMode.description,
		value: plugin.settings.displayMode,
		onChange: async (value) => {
			plugin.settings.displayMode = value;
			await plugin.saveSettings();
			refreshDisplay();
			plugin.refreshView();
		},
	});

	// Dot threshold setting (only shown when displayMode is "dots")
	if (plugin.settings.displayMode === "dots") {
		const sliderRenderer = new SliderSettingRenderer(1, 10, 1);
		sliderRenderer.render(contentEl, {
			name: t.settings.dotThreshold.name,
			description: t.settings.dotThreshold.description,
			value: plugin.settings.dotThreshold,
			onChange: async (value) => {
				plugin.settings.dotThreshold = value;
				await plugin.saveSettings();
				plugin.refreshView();
			},
		});
	}

	// Date field name setting (for YAML source)
	const textRenderer = new TextSettingRenderer("date");
	textRenderer.render(contentEl, {
		name: t.settings.dateFieldName.name,
		description: t.settings.dateFieldName.description,
		value: plugin.settings.dateFieldName,
		onChange: async (value) => {
			plugin.settings.dateFieldName = value.trim() || "date";
			await plugin.saveSettings();
			plugin.refreshView();
		},
	});

	// Date source setting
	const dateSourceRenderer = new DropdownSettingRenderer<DateSource>(plugin, {
		yaml: t.settings.dateSource.options.yaml,
		filename: t.settings.dateSource.options.filename,
	});
	dateSourceRenderer.render(contentEl, {
		name: t.settings.dateSource.name,
		description: t.settings.dateSource.description,
		value: plugin.settings.dateSource,
		onChange: async (value) => {
			plugin.settings.dateSource = value;
			await plugin.saveSettings();
			refreshDisplay();
			plugin.refreshView();
		},
	});

	// Filename date format setting (only shown when dateSource is "filename")
	if (plugin.settings.dateSource === "filename") {
		const filenameFormatRenderer = new TextSettingRenderer("YYYY-MM-DD");
		filenameFormatRenderer.render(contentEl, {
			name: t.settings.filenameDateFormat.name,
			description: t.settings.filenameDateFormat.description,
			value: plugin.settings.filenameDateFormat,
			onChange: async (value) => {
				plugin.settings.filenameDateFormat = value.trim() || "YYYY-MM-DD";
				await plugin.saveSettings();
				plugin.refreshView();
			},
		});
	}

	// Ignored folders setting
	const ignoredFoldersDesc = getIgnoredFoldersDescription(plugin);
	new Setting(contentEl)
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
