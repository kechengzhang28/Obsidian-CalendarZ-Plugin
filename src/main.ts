import {Plugin, WorkspaceLeaf} from 'obsidian';
import {DEFAULT_SETTINGS, CalendarZSettingTab} from "./settings/index";
import type { CalendarZSettings } from "./settings/types";
import {CALENDARZ_VIEW_TYPE, CalendarZView} from "./CalendarView";
import type { CalendarZViewDeps } from "./CalendarView";
import {loadI18n} from "./i18n";
import type {I18n} from "./i18n";

/**
 * Main plugin class for CalendarZ.
 * Manages plugin lifecycle, settings, commands, and view registration.
 */
export default class CalendarZ extends Plugin {
	/** Plugin settings */
	settings: CalendarZSettings;
	/** Internationalization strings */
	i18n: I18n;

	/**
	 * Called when the plugin is loaded.
	 * Initializes settings, i18n, view, commands, and file event listeners.
	 */
	async onload() {
		await this.loadSettings();
		this.loadI18n();

		// Register the calendar view
		this.registerView(
			CALENDARZ_VIEW_TYPE,
			(leaf: WorkspaceLeaf) => new CalendarZView(leaf, this.getViewDeps())
		);

		// Add command to open calendar view
		this.addCommand({
			id: 'open-calendar-view',
			name: this.i18n.commands.openCalendar,
			callback: () => void this.activateView()
		});

		// Add settings tab
		this.addSettingTab(new CalendarZSettingTab(this.app, this));
		this.registerFileEvents();

		// Auto-refresh statistics every second
		this.registerInterval(window.setInterval(() => this.forEachView(v => void v.refreshStatsOnly()), 1000));
	}

	/**
	 * Registers file system event listeners to refresh statistics.
	 * Triggers on create, delete, rename, and modify events.
	 */
	private registerFileEvents(): void {
		const refresh = () => this.forEachView(v => void v.refreshStatsOnly());
		this.registerEvent(this.app.vault.on("create", refresh));
		this.registerEvent(this.app.vault.on("delete", refresh));
		this.registerEvent(this.app.vault.on("rename", refresh));
		this.registerEvent(this.app.vault.on("modify", refresh));
	}

	/**
	 * Iterates over all calendar views and executes a callback.
	 * @param callback - Function to execute for each view
	 */
	private forEachView(callback: (view: CalendarZView) => void): void {
		this.app.workspace.getLeavesOfType(CALENDARZ_VIEW_TYPE)
			.map(leaf => leaf.view)
			.filter((view): view is CalendarZView => view instanceof CalendarZView)
			.forEach(callback);
	}

	/**
	 * Loads plugin settings from storage.
	 * Merges saved settings with defaults.
	 */
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<CalendarZSettings>);
	}

	/**
	 * Saves current settings to storage.
	 */
	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * Loads i18n strings based on current language setting.
	 */
	loadI18n(): void {
		this.i18n = loadI18n(this.settings.language);
	}

	/**
	 * Refreshes all calendar views with current settings.
	 */
	refreshView(): void {
		this.forEachView(v => v.updateSettings());
	}

	/**
	 * Activates or creates the calendar view.
	 * Reveals existing view if open, otherwise creates a new leaf.
	 */
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

	/**
	 * Creates dependencies object for calendar views.
	 * @returns Dependencies needed by CalendarZView
	 */
	private getViewDeps(): CalendarZViewDeps {
		return {
			settings: this.settings,
			i18n: this.i18n,
			app: this.app,
			plugin: this,
			refreshView: () => this.refreshView(),
		};
	}
}
