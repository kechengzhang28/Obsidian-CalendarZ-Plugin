import type { PluginLike } from "../../core/types";
import type { Language } from "../../core/types";
import { SettingGroup } from "../ui/SettingGroup";
import { DropdownSettingRenderer, ButtonSettingRenderer, ToggleSettingRenderer } from "../ui/SettingRenderer";
import { ts, createSettingHandler } from "../settingUtils";

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
		"pt-BR": "Português (Brasil)",
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
		onClick: () => void plugin.activateView(),
	});

	// Auto open calendar view on startup toggle
	const autoOpenViewRenderer = new ToggleSettingRenderer(plugin);
	autoOpenViewRenderer.render(contentEl, {
		name: ts(plugin, "autoOpenView", "name"),
		description: ts(plugin, "autoOpenView", "description"),
		value: plugin.settings.autoOpenView,
		onChange: createSettingHandler({
			plugin,
			settingKey: "autoOpenView",
			refreshDisplay,
		}),
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
