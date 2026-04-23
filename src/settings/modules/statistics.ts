import { App, Setting } from "obsidian";
import { PluginLike } from "../../types";
import { IgnoredFoldersModal } from "../../ui/IgnoredFoldersModal";
import { DateSource, DisplayMode } from "../types";
import { SettingGroup } from "../../ui/components/SettingGroup";
import {
	DropdownSettingRenderer,
	SliderSettingRenderer,
	TextSettingRenderer,
} from "../ui/SettingRenderer";
import { createTypedSettingHandler, createSettingHandlerWithRefresh } from "../settingUtils";
import { DEFAULTS, DISPLAY_MODE, DATE_SOURCE } from "../../constants";

/**
 * Renders statistics settings (display mode, dot threshold, date source, etc.).
 * @param containerEl - Container element
 * @param plugin - Plugin instance
 * @param app - Obsidian App instance
 * @param refreshDisplay - Callback to refresh the settings display
 */
export function renderStatisticsSettings(
	containerEl: HTMLElement,
	plugin: PluginLike,
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
		[DISPLAY_MODE.NONE]: t.settings.displayMode.options.none,
		[DISPLAY_MODE.DOTS]: t.settings.displayMode.options.dots,
		[DISPLAY_MODE.HEATMAP]: t.settings.displayMode.options.heatmap,
	});
	const handleDisplayModeChange = createSettingHandlerWithRefresh<DisplayMode>(
		plugin,
		refreshDisplay,
		"displayMode"
	);
	displayModeRenderer.render(contentEl, {
		name: t.settings.displayMode.name,
		description: t.settings.displayMode.description,
		value: plugin.settings.displayMode,
		onChange: handleDisplayModeChange,
	});

	// Dot threshold setting (only shown when displayMode is dots)
	if (plugin.settings.displayMode === DISPLAY_MODE.DOTS) {
		const sliderRenderer = new SliderSettingRenderer(1, 10, 1, plugin);
		const handleDotThresholdChange = createTypedSettingHandler(plugin, "dotThreshold");
		sliderRenderer.render(contentEl, {
			name: t.settings.dotThreshold.name,
			description: t.settings.dotThreshold.description,
			value: plugin.settings.dotThreshold,
			onChange: handleDotThresholdChange,
		});
	}

	// Date field name setting (for YAML source)
	const textRenderer = new TextSettingRenderer(plugin, DEFAULTS.DATE_FORMAT_PLACEHOLDER);
	const handleDateFieldNameChange = async (value: string) => {
		plugin.settings.dateFieldName = value.trim() || DEFAULTS.DATE_FIELD_NAME;
		await plugin.saveSettings();
		plugin.refreshView();
	};
	textRenderer.render(contentEl, {
		name: t.settings.dateFieldName.name,
		description: t.settings.dateFieldName.description,
		value: plugin.settings.dateFieldName,
		onChange: handleDateFieldNameChange,
	});

	// Date source setting
	const dateSourceRenderer = new DropdownSettingRenderer<DateSource>(plugin, {
		[DATE_SOURCE.YAML]: t.settings.dateSource.options.yaml,
		[DATE_SOURCE.FILENAME]: t.settings.dateSource.options.filename,
	});
	const handleDateSourceChange = createSettingHandlerWithRefresh<DateSource>(
		plugin,
		refreshDisplay,
		"dateSource"
	);
	dateSourceRenderer.render(contentEl, {
		name: t.settings.dateSource.name,
		description: t.settings.dateSource.description,
		value: plugin.settings.dateSource,
		onChange: handleDateSourceChange,
	});

	// Filename date format setting (only shown when dateSource is filename)
	if (plugin.settings.dateSource === DATE_SOURCE.FILENAME) {
		const filenameFormatRenderer = new TextSettingRenderer(plugin, DEFAULTS.FILENAME_FORMAT_PLACEHOLDER);
		const handleFilenameFormatChange = async (value: string) => {
			plugin.settings.filenameDateFormat = value.trim() || DEFAULTS.FILENAME_DATE_FORMAT;
			await plugin.saveSettings();
			plugin.refreshView();
		};
		filenameFormatRenderer.render(contentEl, {
			name: t.settings.filenameDateFormat.name,
			description: t.settings.filenameDateFormat.description,
			value: plugin.settings.filenameDateFormat,
			onChange: handleFilenameFormatChange,
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
 * @param plugin - Plugin instance
 * @returns DocumentFragment with description and bullet list
 */
function getIgnoredFoldersDescription(plugin: PluginLike): DocumentFragment {
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
