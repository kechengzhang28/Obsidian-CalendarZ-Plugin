import type { PluginLike } from "../../core/types";
import type { Language } from "../../core/types";
import { SettingGroup } from "../ui/SettingGroup";
import { DropdownSettingRenderer, ButtonSettingRenderer } from "../ui/SettingRenderer";
import { ts } from "../settingUtils";

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

	// Language setting with special handling (needs to reload i18n before refresh)
	const handleLanguageChange = async (value: Language) => {
		plugin.settings.language = value;
		await plugin.saveSettings();
		plugin.loadI18n();
		refreshDisplay();
		plugin.refreshView();
	};

	const languageRenderer = new DropdownSettingRenderer<Language>(plugin, {
		"en-US": "English",
		"zh-CN": "中文",
	});
	languageRenderer.render(contentEl, {
		name: ts(plugin, "language", "name"),
		description: ts(plugin, "language", "description"),
		value: plugin.settings.language,
		onChange: handleLanguageChange,
	});

	// Open calendar button
	const openCalendarRenderer = new ButtonSettingRenderer(plugin);
	openCalendarRenderer.render(contentEl, {
		name: ts(plugin, "openCalendar", "name"),
		description: ts(plugin, "openCalendar", "description"),
		buttonText: ts(plugin, "openCalendar", "buttonText"),
		onClick: () => plugin.activateView(),
	});

	// Refresh plugin button
	const refreshPluginRenderer = new ButtonSettingRenderer(plugin);
	refreshPluginRenderer.render(contentEl, {
		name: ts(plugin, "refreshPlugin", "name"),
		description: ts(plugin, "refreshPlugin", "description"),
		buttonText: ts(plugin, "refreshPlugin", "buttonText"),
		onClick: () => {
			plugin.refreshView();
		},
	});
}
