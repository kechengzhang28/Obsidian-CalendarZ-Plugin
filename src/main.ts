import {App, Plugin, WorkspaceLeaf} from 'obsidian';
import {DEFAULT_SETTINGS, CalendarZSettings, CalendarZSettingTab} from "./settings";
import {CALENDARZ_VIEW_TYPE, CalendarZView} from "./CalendarView";

export default class CalendarZ extends Plugin {
	settings: CalendarZSettings;

	async onload() {
		await this.loadSettings();

		// Register the calendar view
		this.registerView(
			CALENDARZ_VIEW_TYPE,
			(leaf: WorkspaceLeaf) => new CalendarZView(leaf)
		);

		// Add ribbon icon to open calendar view
		this.addRibbonIcon('calendar', 'Open CalendarZ', async () => {
			await this.activateView();
		});

		// Command to open calendar view
		this.addCommand({
			id: 'open-calendarz-view',
			name: 'Open CalendarZ view',
			callback: async () => {
				await this.activateView();
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new CalendarZSettingTab(this.app, this));
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(CALENDARZ_VIEW_TYPE);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<CalendarZSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async activateView(): Promise<void> {
		const { workspace } = this.app;

		// Check if view already exists
		const existingLeaf = workspace.getLeavesOfType(CALENDARZ_VIEW_TYPE)[0];

		if (existingLeaf) {
			workspace.revealLeaf(existingLeaf);
			return;
		}

		// Create new leaf in right sidebar
		const leaf = workspace.getRightLeaf(false);
		if (!leaf) {
			return;
		}
		await leaf.setViewState({
			type: CALENDARZ_VIEW_TYPE,
			active: true,
		});

		// Reveal the leaf
		workspace.revealLeaf(leaf);
	}
}
