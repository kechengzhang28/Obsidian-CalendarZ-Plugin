import {Plugin, WorkspaceLeaf, TFile} from 'obsidian';
import type {CachedMetadata} from 'obsidian';
import {DEFAULT_SETTINGS, CalendarZSettingTab} from "./settings/index";
import type { CalendarZSettings } from "./core/types";
import {CALENDARZ_VIEW_TYPE, CalendarZView} from "./ui/view/CalendarZView";
import type { CalendarZViewDeps } from "./ui/view/CalendarZView";
import {loadI18n} from "./i18n";
import type {I18n} from "./i18n";

/**
 * Main plugin class for CalendarZ.
 * Manages plugin lifecycle, settings, commands, and view registration.
 */
export default class CalendarZ extends Plugin {
	settings: CalendarZSettings;
	i18n: I18n;
	private previousCaches = new Map<string, CachedMetadata>();
	private fileMtimes = new Map<string, number>();

	async onload() {
		await this.loadSettings();
		this.loadI18n();

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

			const oldCache = this.previousCaches.get(file.path);
			const dateField = this.settings.dateFieldName;
			const oldDate = oldCache?.frontmatter?.[dateField] as unknown;
			const newDate = cache.frontmatter?.[dateField] as unknown;

			if (oldDate !== newDate) {
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
			settings: this.settings,
			app: this.app,
			i18n: this.i18n,
			plugin: this,
			refreshView: () => this.refreshView(),
		};
	}
}
