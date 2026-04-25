import {Plugin, WorkspaceLeaf, TFile} from 'obsidian';
import type {CachedMetadata} from 'obsidian';
import {DEFAULT_SETTINGS, CalendarZSettingTab} from "./settings/index";
import type { CalendarZSettings } from "./core/types";
import {CALENDARZ_VIEW_TYPE, CalendarZView} from "./ui/view/CalendarZView";
import type { CalendarZViewDeps } from "./ui/view/CalendarZView";
import {loadI18n} from "./i18n";
import type {I18n} from "./i18n";
import { TodoService } from "./services/todos/TodoService";

/**
 * Main plugin class for CalendarZ.
 * Manages plugin lifecycle, settings, commands, and view registration.
 */
export default class CalendarZ extends Plugin {
	settings: CalendarZSettings;
	i18n: I18n;
	private previousCaches = new Map<string, CachedMetadata>();
	private fileMtimes = new Map<string, number>();
	private todoService: TodoService;
	private readonly MAX_CACHE_SIZE = 1000;

	async onload() {
		await this.loadSettings();
		this.loadI18n();
		this.todoService = new TodoService(this.app);

		this.registerView(
			CALENDARZ_VIEW_TYPE,
			(leaf: WorkspaceLeaf) => new CalendarZView(leaf, this.getViewDeps())
		);

		this.addCommand({
			id: 'open-calendar-view',
			name: this.i18n.commands.openCalendar,
			callback: () => void this.activateView()
		});

		this.addSettingTab(new CalendarZSettingTab(this.app, this));

		this.app.workspace.onLayoutReady(async () => {
			await this.activateView();
			this.forEachView(v => void v.refreshStatsOnly());
		});

		this.registerFileEvents();

		this.registerInterval(window.setInterval(() => this.forEachView(v => void v.refreshStatsOnly()), 30000));
	}

	private registerFileEvents(): void {
		this.registerEvent(this.app.metadataCache.on("changed", (file: TFile, _data: string, cache: CachedMetadata) => {
			if (file.extension !== "md") return;

			// Enforce cache size limit to prevent memory leaks
			this.enforceCacheSizeLimit();

			const oldCache = this.previousCaches.get(file.path);
			const dateField = this.settings.dateFieldName;
			const oldDate = oldCache?.frontmatter?.[dateField] as unknown;
			const newDate = cache.frontmatter?.[dateField] as unknown;
			const dateChanged = oldDate !== newDate;

			// Check if todo status may have changed by comparing file modification time
			const oldMtime = this.fileMtimes.get(file.path);
			const mtimeChanged = oldMtime !== file.stat.mtime;

			// Clear todo cache for this file if content may have changed
			if (mtimeChanged) {
				this.todoService.clearFileCache(file.path);
			}

			// Refresh view if date changed or file content changed (may affect todos)
			if (dateChanged || mtimeChanged) {
				this.forEachView(v => void v.refreshStatsOnly());
			}

			this.previousCaches.set(file.path, cache);
			this.fileMtimes.set(file.path, file.stat.mtime);
		}));

		this.registerEvent(this.app.vault.on("create", (file) => {
			if (file instanceof TFile) {
				this.fileMtimes.set(file.path, file.stat.mtime);
				this.forEachView(v => void v.refreshStatsOnly());
			}
		}));

		this.registerEvent(this.app.vault.on("delete", (file) => {
			if (file instanceof TFile) {
				this.previousCaches.delete(file.path);
				this.fileMtimes.delete(file.path);
				this.forEachView(v => void v.refreshStatsOnly());
			}
		}));

		this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
			if (file instanceof TFile) {
				const oldCache = this.previousCaches.get(oldPath);
				if (oldCache) {
					this.previousCaches.set(file.path, oldCache);
					this.previousCaches.delete(oldPath);
				}
				this.fileMtimes.delete(oldPath);
				this.fileMtimes.set(file.path, file.stat.mtime);
				this.forEachView(v => void v.refreshStatsOnly());
			}
		}));
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

	private getViewDeps(): CalendarZViewDeps {
		return {
			app: this.app,
			plugin: {
				i18n: this.i18n,
				settings: this.settings,
				todoService: this.todoService,
			},
		};
	}

	/**
	 * Enforces cache size limit to prevent memory leaks.
	 * Removes oldest entries when cache exceeds MAX_CACHE_SIZE.
	 */
	private enforceCacheSizeLimit(): void {
		if (this.previousCaches.size > this.MAX_CACHE_SIZE) {
			const keysToDelete = this.previousCaches.size - this.MAX_CACHE_SIZE;
			const keys = Array.from(this.previousCaches.keys()).slice(0, keysToDelete);
			for (const key of keys) {
				this.previousCaches.delete(key);
				this.fileMtimes.delete(key);
			}
		}
	}

	/**
	 * Cleanup resources when plugin is unloaded.
	 * Prevents memory leaks by clearing all caches and references.
	 */
	onunload(): void {
		// Clear custom caches
		this.previousCaches.clear();
		this.fileMtimes.clear();

		// Clear todo service cache
		if (this.todoService) {
			this.todoService.clearCache();
		}
	}
}
