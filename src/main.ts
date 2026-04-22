import { Plugin, WorkspaceLeaf } from 'obsidian';
import { DEFAULT_SETTINGS, CalendarZSettings, CalendarZSettingTab } from "./settings";
import { HeatmapView, VIEW_TYPE_HEATMAP } from "./heatmap-view";

export default class CalendarZ extends Plugin {
	settings: CalendarZSettings;

	async onload() {
		await this.loadSettings();

		this.registerView(
			VIEW_TYPE_HEATMAP,
			(leaf: WorkspaceLeaf) => new HeatmapView(leaf)
		);

		this.addRibbonIcon('calendar', 'Open Note Heatmap', (evt: MouseEvent) => {
			this.activateView();
		});

		this.addCommand({
			id: 'open-heatmap-view',
			name: 'Open note heatmap',
			callback: () => {
				this.activateView();
			}
		});

		this.addSettingTab(new CalendarZSettingTab(this.app, this));

		if (this.settings.showOnStartup) {
			this.app.workspace.onLayoutReady(() => {
				this.activateView();
			});
		}
	}

	onunload() {
		this.app.workspace.getLeavesOfType(VIEW_TYPE_HEATMAP).forEach(leaf => {
			leaf.detach();
		});
	}

	async activateView() {
		const { workspace } = this.app;

		const existingLeaf = workspace.getLeavesOfType(VIEW_TYPE_HEATMAP)[0];
		if (existingLeaf) {
			workspace.revealLeaf(existingLeaf);
			return;
		}

		const newLeaf = workspace.getRightLeaf(false);
		if (newLeaf) {
			await newLeaf.setViewState({
				type: VIEW_TYPE_HEATMAP,
				active: true,
			});
			workspace.revealLeaf(newLeaf);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<CalendarZSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
