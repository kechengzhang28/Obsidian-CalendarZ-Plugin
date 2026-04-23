import CalendarZ from "../../main";
import { SettingGroup } from "../../ui/components/SettingGroup";
import { ToggleSettingRenderer } from "../ui/SettingRenderer";

/**
 * Renders click behavior settings.
 * @param containerEl - Container element
 * @param plugin - CalendarZ plugin instance
 */
export function renderClickSettings(containerEl: HTMLElement, plugin: CalendarZ): void {
	const t = plugin.i18n;

	const group = new SettingGroup({ title: t.sectionTitles.click });
	group.render(containerEl);
	const contentEl = group.getContentEl();
	if (!contentEl) return;

	// Confirm before creating daily note setting
	const toggleRenderer = new ToggleSettingRenderer(plugin);
	toggleRenderer.render(contentEl, {
		name: t.settings.confirmBeforeCreate.name,
		description: t.settings.confirmBeforeCreate.description,
		value: plugin.settings.confirmBeforeCreate,
		onChange: async (value) => {
			plugin.settings.confirmBeforeCreate = value;
			await plugin.saveSettings();
			plugin.refreshView();
		},
	});
}
