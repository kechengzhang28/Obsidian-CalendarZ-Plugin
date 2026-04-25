import type { PluginLike } from "../../core/types";
import type { MonthFormat, TitleFormat, WeekStart } from "../../core/types";
import { SettingGroup } from "../ui/SettingGroup";
import { DropdownSettingRenderer, ToggleSettingRenderer } from "../ui/SettingRenderer";
import { createSettingHandler } from "../settingUtils";

/** Helper to get nested i18n string values from settings section */
function ts(plugin: PluginLike, section: string, key: string): string {
	return ((plugin.i18n.settings as Record<string, Record<string, string>>)[section]!)[key]!;
}

/** Helper to get dropdown option labels from nested options object */
function topt(plugin: PluginLike, section: string, optionKey: string): string {
	const opts = (plugin.i18n.settings as Record<string, unknown>)[section] as Record<string, unknown>;
	return (opts.options as Record<string, string>)[optionKey]!;
}

/**
 * Renders basic settings (month format, title format, week start).
 * @param containerEl - Container element
 * @param plugin - Plugin instance
 */
export function renderBasicSettings(containerEl: HTMLElement, plugin: PluginLike): void {
	const sectionTitles = plugin.i18n.sectionTitles as Record<string, string>;
	const group = new SettingGroup({ title: sectionTitles.basic! });
	group.render(containerEl);
	const contentEl = group.getContentEl();
	if (!contentEl) return;

	// Month format setting
	const monthFormatRenderer = new DropdownSettingRenderer<MonthFormat>(plugin, {
		numeric: topt(plugin, "monthFormat", "numeric"),
		short: topt(plugin, "monthFormat", "short"),
		long: topt(plugin, "monthFormat", "long"),
	});
	const handleMonthFormatChange = createSettingHandler({ plugin, settingKey: "monthFormat" });
	monthFormatRenderer.render(contentEl, {
		name: ts(plugin, "monthFormat", "name"),
		description: ts(plugin, "monthFormat", "description"),
		value: plugin.settings.monthFormat,
		onChange: handleMonthFormatChange,
	});

	// Title format setting
	const titleFormatRenderer = new DropdownSettingRenderer<TitleFormat>(plugin, {
		yearMonth: topt(plugin, "titleFormat", "yearMonth"),
		monthYear: topt(plugin, "titleFormat", "monthYear"),
	});
	const handleTitleFormatChange = createSettingHandler({ plugin, settingKey: "titleFormat" });
	titleFormatRenderer.render(contentEl, {
		name: ts(plugin, "titleFormat", "name"),
		description: ts(plugin, "titleFormat", "description"),
		value: plugin.settings.titleFormat,
		onChange: handleTitleFormatChange,
	});

	// Week start setting
	const weekStartRenderer = new DropdownSettingRenderer<WeekStart>(plugin, {
		sunday: topt(plugin, "weekStart", "sunday"),
		monday: topt(plugin, "weekStart", "monday"),
	});
	const handleWeekStartChange = createSettingHandler({ plugin, settingKey: "weekStart" });
	weekStartRenderer.render(contentEl, {
		name: ts(plugin, "weekStart", "name"),
		description: ts(plugin, "weekStart", "description"),
		value: plugin.settings.weekStart,
		onChange: handleWeekStartChange,
	});

	// Show week number setting
	const showWeekNumberRenderer = new ToggleSettingRenderer(plugin);
	const handleShowWeekNumberChange = createSettingHandler({ plugin, settingKey: "showWeekNumber" });
	showWeekNumberRenderer.render(contentEl, {
		name: ts(plugin, "showWeekNumber", "name"),
		description: ts(plugin, "showWeekNumber", "description"),
		value: plugin.settings.showWeekNumber,
		onChange: handleShowWeekNumberChange,
	});
}
