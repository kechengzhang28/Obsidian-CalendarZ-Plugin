import {Plugin, WorkspaceLeaf, TFile} from 'obsidian';
import type {CachedMetadata} from 'obsidian';
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
	/** Cache for previous metadata to detect date field changes */
	private previousCaches = new Map<string, CachedMetadata>();
	/** Cache for file modification times */
	private fileMtimes = new Map<string, number>();

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

		// Auto-open calendar view on plugin load and initial refresh
		this.app.workspace.onLayoutReady(async () => {
			await this.activateView();
			this.forEachView(v => v.refreshStatsOnly());
		});

		this.registerFileEvents();

		// Auto-refresh statistics every 30 seconds as a fallback
		this.registerInterval(window.setInterval(() => this.forEachView(v => v.refreshStatsOnly()), 30000));
	}

	/**
	 * Registers file system event listeners to refresh statistics.
	 * Uses metadataCache for precise change detection.
	 */
	private registerFileEvents(): void {
		// Listen to metadata changes for precise date field detection
		this.registerEvent(this.app.metadataCache.on("changed", (file: TFile, _data: string, cache: CachedMetadata) => {
			if (file.extension !== "md") return;

			// Check if date field changed
			const oldCache = this.previousCaches.get(file.path);
			const dateField = this.settings.dateFieldName;
			const oldDate = oldCache?.frontmatter?.[dateField] as unknown;
			const newDate = cache.frontmatter?.[dateField] as unknown;

			if (oldDate !== newDate) {
				this.forEachView(v => v.refreshStatsOnly());
			}

			// Update cache
			this.previousCaches.set(file.path, cache);
			this.fileMtimes.set(file.path, file.stat.mtime);
		}));

		// File creation - new file may have date
		this.registerEvent(this.app.vault.on("create", (file) => {
			if (file instanceof TFile) {
				this.fileMtimes.set(file.path, file.stat.mtime);
				this.forEachView(v => v.refreshStatsOnly());
			}
		}));

		// File deletion - remove from cache
		this.registerEvent(this.app.vault.on("delete", (file) => {
			if (file instanceof TFile) {
				this.previousCaches.delete(file.path);
				this.fileMtimes.delete(file.path);
				this.forEachView(v => v.refreshStatsOnly());
			}
		}));

		// File rename - update cache keys
		this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
			if (file instanceof TFile) {
				const oldCache = this.previousCaches.get(oldPath);
				if (oldCache) {
					this.previousCaches.set(file.path, oldCache);
					this.previousCaches.delete(oldPath);
				}
				this.fileMtimes.delete(oldPath);
				this.fileMtimes.set(file.path, file.stat.mtime);
				this.forEachView(v => v.refreshStatsOnly());
			}
		}));
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
			app: this.app,
			plugin: this,
			refreshView: () => this.refreshView(),
		};
	}
}
