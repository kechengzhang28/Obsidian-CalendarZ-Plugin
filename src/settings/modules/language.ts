import type { PluginLike } from "../../types";
import type { Language } from "../types";
import { SettingGroup } from "../ui/SettingGroup";
import { DropdownSettingRenderer, ButtonSettingRenderer } from "../ui/SettingRenderer";
import { createSettingHandler } from "../settingUtils";

/**
 * Renders language settings.
 * @param containerEl - Container element
 * @param plugin - Plugin instance
 * @param refreshDisplay - Callback to refresh the settings display
 */
export function renderLanguageSettings(
	containerEl: HTMLElement,
	plugin: PluginLike,
	refreshDisplay: () => void
): void {
	const group = new SettingGroup({ title: "" });
	group.render(containerEl);
	const contentEl = group.getContentEl();
	if (!contentEl) return;

	const t = plugin.i18n;

	// Language setting with special handling (needs to reload i18n)
	const handleLanguageChange = createSettingHandler({
		plugin,
		settingKey: "language",
		postSave: () => {
			plugin.loadI18n();
			refreshDisplay();
		},
	});

	const languageRenderer = new DropdownSettingRenderer<Language>(plugin, {
		"en-US": "English",
		"zh-CN": "中文",
	});
	languageRenderer.render(contentEl, {
		name: t.settings.language.name,
		description: t.settings.language.description,
		value: plugin.settings.language,
		onChange: handleLanguageChange,
	});

	// Open calendar button
	const openCalendarRenderer = new ButtonSettingRenderer(plugin);
	openCalendarRenderer.render(contentEl, {
		name: t.settings.openCalendar.name,
		description: t.settings.openCalendar.description,
		buttonText: t.settings.openCalendar.buttonText,
		onClick: () => plugin.activateView(),
	});

	// Refresh plugin button
	const refreshPluginRenderer = new ButtonSettingRenderer(plugin);
	refreshPluginRenderer.render(contentEl, {
		name: t.settings.refreshPlugin.name,
		description: t.settings.refreshPlugin.description,
		buttonText: t.settings.refreshPlugin.buttonText,
		onClick: () => plugin.refreshView(),
	});
}
