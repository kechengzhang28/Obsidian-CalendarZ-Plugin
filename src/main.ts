import {Plugin, WorkspaceLeaf} from 'obsidian';
import {DEFAULT_SETTINGS, CalendarZSettings, CalendarZSettingTab} from "./settings";
import {CALENDARZ_VIEW_TYPE, CalendarZView} from "./CalendarView";
import {I18n, loadI18n} from "./i18n";

export default class CalendarZ extends Plugin {
	settings: CalendarZSettings;
	i18n: I18n;

	async onload() {
		await this.loadSettings();
		this.loadI18n();

		// Register the calendar view
		this.registerView(
			CALENDARZ_VIEW_TYPE,
			(leaf: WorkspaceLeaf) => new CalendarZView(leaf, this.i18n, this.settings.monthFormat, this.settings.language, this.settings.titleFormat, this.settings.weekStart, this.settings.dateFieldName, this.settings.ignoredFolders, this.settings.dateSource, this.settings.filenameDateFormat)
		);

		// Add ribbon icon to open calendar view
		this.addRibbonIcon('calendar', this.i18n.ribbon.tooltip, async () => {
			await this.activateView();
		});

		// Command to open calendar view
		this.addCommand({
			id: 'open-calendar-view',
			name: this.i18n.commands.openCalendar,
			callback: async () => {
				await this.activateView();
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new CalendarZSettingTab(this.app, this));
	}

	onunload() {
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
		const leaves = this.app.workspace.getLeavesOfType(CALENDARZ_VIEW_TYPE);
		leaves.forEach(leaf => {
			if (leaf.view instanceof CalendarZView) {
				leaf.view.setI18n(this.i18n);
				leaf.view.setMonthFormat(this.settings.monthFormat);
				leaf.view.setLanguage(this.settings.language);
				leaf.view.setTitleFormat(this.settings.titleFormat);
				leaf.view.setWeekStart(this.settings.weekStart);
				leaf.view.setDateFieldName(this.settings.dateFieldName);
				leaf.view.setIgnoredFolders(this.settings.ignoredFolders);
				leaf.view.setDateSource(this.settings.dateSource);
				leaf.view.setFilenameDateFormat(this.settings.filenameDateFormat);
				void leaf.view.refresh();
			}
		});
	}

	async activateView(): Promise<void> {
		const { workspace } = this.app;

		// Check if view already exists
		const existingLeaf = workspace.getLeavesOfType(CALENDARZ_VIEW_TYPE)[0];

		if (existingLeaf) {
			void workspace.revealLeaf(existingLeaf);
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
		void workspace.revealLeaf(leaf);
	}
}
