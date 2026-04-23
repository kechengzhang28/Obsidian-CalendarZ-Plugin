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
			(leaf: WorkspaceLeaf) => new CalendarZView(leaf, this.i18n, this.settings, this)
		);

		this.addRibbonIcon('calendar', this.i18n.ribbon.tooltip, () => this.activateView());

		this.addCommand({
			id: 'open-calendar-view',
			name: this.i18n.commands.openCalendar,
			callback: () => this.activateView()
		});

		this.addSettingTab(new CalendarZSettingTab(this.app, this));
		this.registerFileEvents();

		// Update "today" highlight every 1 seconds
		this.registerInterval(window.setInterval(() => this.updateTodayHighlight(), 1000));
	}

	/**
	 * Registers file system event listeners to refresh the calendar view.
	 */
	private registerFileEvents(): void {
		this.registerEvent(this.app.vault.on("create", () => this.refreshCalendarView()));
		this.registerEvent(this.app.vault.on("delete", () => this.refreshCalendarView()));
		this.registerEvent(this.app.vault.on("rename", () => this.refreshCalendarView()));
	}

	/**
	 * Refreshes only the calendar view content without reloading settings.
	 */
	private refreshCalendarView(): void {
		this.getCalendarViews().forEach(view => {
			void view.refreshStatsOnly();
		});
	}

	/**
	 * Updates the "today" highlight on all calendar views.
	 */
	private updateTodayHighlight(): void {
		this.getCalendarViews().forEach(view => {
			void view.updateTodayHighlight();
		});
	}

	/**
	 * Gets all calendar view instances.
	 */
	private getCalendarViews(): CalendarZView[] {
		return this.app.workspace.getLeavesOfType(CALENDARZ_VIEW_TYPE)
			.map(leaf => leaf.view)
			.filter((view): view is CalendarZView => view instanceof CalendarZView);
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
		const settings = this.settings;
		this.getCalendarViews().forEach(view => {
			view.setI18n(this.i18n);
			view.setMonthFormat(settings.monthFormat);
			view.setLanguage(settings.language);
			view.setTitleFormat(settings.titleFormat);
			view.setWeekStart(settings.weekStart);
			view.setDateFieldName(settings.dateFieldName);
			view.setIgnoredFolders(settings.ignoredFolders);
			view.setDateSource(settings.dateSource);
			view.setFilenameDateFormat(settings.filenameDateFormat);
			view.setDisplayMode(settings.displayMode);
			view.setDotThreshold(settings.dotThreshold);
			view.setConfirmBeforeCreate(settings.confirmBeforeCreate);
			void view.refresh();
		});
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
