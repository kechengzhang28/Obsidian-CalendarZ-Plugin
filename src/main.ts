import {Plugin, WorkspaceLeaf} from 'obsidian';
import {DEFAULT_SETTINGS, CalendarZSettings, CalendarZSettingTab} from "./settings/index";
import {CALENDARZ_VIEW_TYPE, CalendarZView} from "./CalendarView";
import {I18n, loadI18n} from "./i18n";

export default class CalendarZ extends Plugin {
	settings: CalendarZSettings;
	i18n: I18n;

	async onload() {
		await this.loadSettings();
		this.loadI18n();

		this.registerView(
			CALENDARZ_VIEW_TYPE,
			(leaf: WorkspaceLeaf) => new CalendarZView(leaf, this)
		);

		this.addCommand({
			id: 'open-calendar-view',
			name: this.i18n.commands.openCalendar,
			callback: () => void this.activateView()
		});

		this.addSettingTab(new CalendarZSettingTab(this.app, this));
		this.registerFileEvents();

		this.registerInterval(window.setInterval(() => this.forEachView(v => void v.refreshStatsOnly()), 1000));
	}

	private registerFileEvents(): void {
		const refresh = () => this.forEachView(v => void v.refreshStatsOnly());
		this.registerEvent(this.app.vault.on("create", refresh));
		this.registerEvent(this.app.vault.on("delete", refresh));
		this.registerEvent(this.app.vault.on("rename", refresh));
		this.registerEvent(this.app.vault.on("modify", refresh));
	}

	private forEachView(callback: (view: CalendarZView) => void): void {
		this.app.workspace.getLeavesOfType(CALENDARZ_VIEW_TYPE)
			.map(leaf => leaf.view)
			.filter((view): view is CalendarZView => view instanceof CalendarZView)
			.forEach(callback);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<CalendarZSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	loadI18n(): void {
		this.i18n = loadI18n(this.settings.language);
	}

	refreshView(): void {
		this.forEachView(v => v.updateSettings());
	}

	async activateView(): Promise<void> {
		const { workspace } = this.app;
		const existingLeaf = workspace.getLeavesOfType(CALENDARZ_VIEW_TYPE)[0];

		if (existingLeaf) {
			void workspace.revealLeaf(existingLeaf);
			return;
		}

		const leaf = workspace.getRightLeaf(false);
		if (!leaf) return;

		await leaf.setViewState({ type: CALENDARZ_VIEW_TYPE, active: true });
		void workspace.revealLeaf(leaf);
	}
}
