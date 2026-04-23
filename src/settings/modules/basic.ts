import CalendarZ from "../../main";
import { MonthFormat, TitleFormat, WeekStart } from "../types";
import { SettingGroup } from "../../ui/components/SettingGroup";
import {
	DropdownSettingRenderer,
} from "../ui/SettingRenderer";

/**
 * Renders basic settings (month format, title format, week start).
 * @param containerEl - Container element
 * @param plugin - CalendarZ plugin instance
 */
export function renderBasicSettings(containerEl: HTMLElement, plugin: CalendarZ): void {
	const t = plugin.i18n;

	const group = new SettingGroup({ title: t.sectionTitles.basic });
	group.render(containerEl);
	const contentEl = group.getContentEl();
	if (!contentEl) return;

	// Month format setting
	const monthFormatRenderer = new DropdownSettingRenderer<MonthFormat>(plugin, {
		numeric: t.settings.monthFormat.options.numeric,
		short: t.settings.monthFormat.options.short,
		long: t.settings.monthFormat.options.long,
	});
	monthFormatRenderer.render(contentEl, {
		name: t.settings.monthFormat.name,
		description: t.settings.monthFormat.description,
		value: plugin.settings.monthFormat,
		onChange: async (value) => {
			plugin.settings.monthFormat = value;
			await plugin.saveSettings();
			plugin.refreshView();
		},
	});

	// Title format setting
	const titleFormatRenderer = new DropdownSettingRenderer<TitleFormat>(plugin, {
		yearMonth: t.settings.titleFormat.options.yearMonth,
		monthYear: t.settings.titleFormat.options.monthYear,
	});
	titleFormatRenderer.render(contentEl, {
		name: t.settings.titleFormat.name,
		description: t.settings.titleFormat.description,
		value: plugin.settings.titleFormat,
		onChange: async (value) => {
			plugin.settings.titleFormat = value;
			await plugin.saveSettings();
			plugin.refreshView();
		},
	});

	// Week start setting
	const weekStartRenderer = new DropdownSettingRenderer<WeekStart>(plugin, {
		sunday: t.settings.weekStart.options.sunday,
		monday: t.settings.weekStart.options.monday,
	});
	weekStartRenderer.render(contentEl, {
		name: t.settings.weekStart.name,
		description: t.settings.weekStart.description,
		value: plugin.settings.weekStart,
		onChange: async (value) => {
			plugin.settings.weekStart = value;
			await plugin.saveSettings();
			plugin.refreshView();
		},
	});
}
