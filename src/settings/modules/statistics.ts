import { App } from "obsidian";
import type { PluginLike } from "../../core/types";
import { IgnoredFoldersModal } from "../../ui/modals/IgnoredFoldersModal";
import type { DateSource, DisplayMode, StatisticsType } from "../../core/types";
import { SettingGroup } from "../ui/SettingGroup";
import {
	DropdownSettingRenderer,
	TextSettingRenderer,
	ButtonSettingRenderer,
} from "../ui/SettingRenderer";
import { createSettingHandler } from "../settingUtils";
import { DEFAULTS, DISPLAY_MODE, DATE_SOURCE, STATISTICS_TYPE } from "../../core/constants";

/** Helper to get nested i18n string values */
function ts(plugin: PluginLike, section: string, key: string): string {
	return ((plugin.i18n.settings as Record<string, Record<string, string>>)[section]!)[key]!;
}

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
	const sectionTitles = plugin.i18n.sectionTitles as Record<string, string>;
	const group = new SettingGroup({ title: sectionTitles.statistics! });
	group.render(containerEl);
	const contentEl = group.getContentEl();
	if (!contentEl) return;

	// Display mode setting
	const displayModeRenderer = new DropdownSettingRenderer<DisplayMode>(plugin, {
		[DISPLAY_MODE.NONE]: ts(plugin, "displayMode", "options_none"),
		[DISPLAY_MODE.DOTS]: ts(plugin, "displayMode", "options_dots"),
		[DISPLAY_MODE.HEATMAP]: ts(plugin, "displayMode", "options_heatmap"),
	});
	const handleDisplayModeChange = createSettingHandler({
		plugin,
		settingKey: "displayMode",
	});
	displayModeRenderer.render(contentEl, {
		name: ts(plugin, "displayMode", "name"),
		description: ts(plugin, "displayMode", "description"),
		value: plugin.settings.displayMode,
		onChange: handleDisplayModeChange,
	});

	// Statistics type setting
	const statisticsTypeRenderer = new DropdownSettingRenderer<StatisticsType>(plugin, {
		[STATISTICS_TYPE.COUNT]: ts(plugin, "statisticsType", "options_count"),
		[STATISTICS_TYPE.WORD_COUNT]: ts(plugin, "statisticsType", "options_wordCount"),
	});
	const handleStatisticsTypeChange = createSettingHandler({
		plugin,
		settingKey: "statisticsType",
	});
	statisticsTypeRenderer.render(contentEl, {
		name: ts(plugin, "statisticsType", "name"),
		description: ts(plugin, "statisticsType", "description"),
		value: plugin.settings.statisticsType,
		onChange: handleStatisticsTypeChange,
	});

	// Date source setting
	const dateSourceRenderer = new DropdownSettingRenderer<DateSource>(plugin, {
		[DATE_SOURCE.YAML]: ts(plugin, "dateSource", "options_yaml"),
		[DATE_SOURCE.FILENAME]: ts(plugin, "dateSource", "options_filename"),
		[DATE_SOURCE.BOTH]: ts(plugin, "dateSource", "options_both"),
	});
	const handleDateSourceChange = createSettingHandler({ plugin, settingKey: "dateSource" });
	dateSourceRenderer.render(contentEl, {
		name: ts(plugin, "dateSource", "name"),
		description: ts(plugin, "dateSource", "description"),
		value: plugin.settings.dateSource,
		onChange: handleDateSourceChange,
	});

	// Date field name setting
	const dateFieldNameRenderer = new TextSettingRenderer(plugin, DEFAULTS.DATE_FIELD_NAME);
	const handleDateFieldNameChange = createSettingHandler({
		plugin,
		settingKey: "dateFieldName",
	});
	dateFieldNameRenderer.render(contentEl, {
		name: ts(plugin, "dateFieldName", "name"),
		description: ts(plugin, "dateFieldName", "description"),
		value: plugin.settings.dateFieldName,
		onChange: handleDateFieldNameChange,
	});

	// Filename date format setting
	const filenameDateFormatRenderer = new TextSettingRenderer(plugin, DEFAULTS.FILENAME_DATE_FORMAT);
	const handleFilenameDateFormatChange = createSettingHandler({
		plugin,
		settingKey: "filenameDateFormat",
	});
	filenameDateFormatRenderer.render(contentEl, {
		name: ts(plugin, "filenameDateFormat", "name"),
		description: ts(plugin, "filenameDateFormat", "description"),
		value: plugin.settings.filenameDateFormat,
		onChange: handleFilenameDateFormatChange,
	});

	// Ignored folders setting
	const ignoredFoldersRenderer = new ButtonSettingRenderer(plugin);
	const handleIgnoredFoldersChange = async (folders: string[]) => {
		plugin.settings.ignoredFolders = folders;
		await plugin.saveSettings();
		plugin.refreshView();
	};
	ignoredFoldersRenderer.render(contentEl, {
		name: ts(plugin, "ignoredFolders", "name"),
		description: ts(plugin, "ignoredFolders", "description"),
		buttonText: ts(plugin, "ignoredFolders", "manageButton"),
		onClick: () => {
			new IgnoredFoldersModal(
				app,
				plugin.settings.ignoredFolders,
				plugin.i18n,
				handleIgnoredFoldersChange
			).open();
		},
	});
}
