import { ItemView, WorkspaceLeaf } from "obsidian";
import dayjs from "dayjs";
import { I18n } from "./i18n";
import { CalendarHeader } from "./ui/CalendarHeader";
import { WeekdaysRow } from "./ui/WeekdaysRow";
import { DaysGrid, DateCount } from "./ui/DaysGrid";
import { ConfirmModal } from "./ui/ConfirmModal";
import { CalendarZSettings } from "./settings/index";
import { getNotesCountByYamlDate, getNotesCountByFilenameDate } from "./utils/GetNotes";
import { openOrCreateDailyNote, findDailyNote } from "./utils/createNote";
import { CSS_CLASSES, ATTRS, DISPLAY_MODE, DATE_SOURCE, DATE_FORMAT } from "./constants";
import CalendarZ from "./main";

export const CALENDARZ_VIEW_TYPE = "calendarz-view";

export class CalendarZView extends ItemView {
	private currentDate = new Date();
	private plugin: CalendarZ;
	private daysGrid: DaysGrid | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: CalendarZ) {
		super(leaf);
		this.plugin = plugin;
	}

	/**
	 * Gets the plugin settings
	 */
	private get settings(): CalendarZSettings {
		return this.plugin.settings;
	}

	/**
	 * Gets the i18n strings
	 */
	private get i18n(): I18n {
		return this.plugin.i18n;
	}

	getViewType(): string {
		return CALENDARZ_VIEW_TYPE;
	}

	getDisplayText(): string {
		return this.i18n.calendar.viewTitle;
	}

	getIcon(): string {
		return "calendar";
	}

	/**
	 * Updates the view when settings change
	 */
	updateSettings(): void {
		void this.renderCalendar();
	}

	async onOpen(): Promise<void> {
		await this.renderCalendar();
	}

	async onClose(): Promise<void> {
		this.contentEl.empty();
	}

	async refreshStatsOnly(): Promise<void> {
		if (this.settings.displayMode === DISPLAY_MODE.NONE) return;

		const dateCounts = await this.fetchDateCounts();
		if (this.daysGrid) {
			this.daysGrid.updateDisplay(dateCounts);
		} else {
			void this.renderCalendar();
		}
	}

	async updateTodayHighlight(): Promise<void> {
		const today = dayjs();
		const current = dayjs(this.currentDate);

		if (today.year() !== current.year() || today.month() !== current.month()) {
			this.currentDate = new Date();
			await this.renderCalendar();
			return;
		}

		const todayStr = today.format(DATE_FORMAT);
		this.contentEl.querySelectorAll(`.${CSS_CLASSES.DAY}`).forEach(el => {
			const isToday = el.getAttribute(ATTRS.DATA_DATE) === todayStr;
			el.toggleClass(CSS_CLASSES.DAY_TODAY, isToday);
			if (this.settings.displayMode !== DISPLAY_MODE.HEATMAP) {
				el.toggleClass(CSS_CLASSES.DAY_TODAY_THEMED, isToday);
			}
		});
	}

	private async renderCalendar(): Promise<void> {
		this.contentEl.empty();
		this.contentEl.addClass(CSS_CLASSES.CONTAINER);

		const header = new CalendarHeader({
			i18n: this.i18n,
			monthFormat: this.settings.monthFormat,
			language: this.settings.language,
			titleFormat: this.settings.titleFormat,
			callbacks: {
				onPrevMonth: () => this.navigateMonth(-1),
				onNextMonth: () => this.navigateMonth(1),
				onToday: () => this.goToToday(),
			},
			initialDate: this.currentDate,
		});
		header.render(this.contentEl);

		new WeekdaysRow(this.contentEl, this.i18n, this.settings.weekStart).render();

		const dateCounts = this.settings.displayMode !== DISPLAY_MODE.NONE
			? await this.fetchDateCounts()
			: [];

		this.daysGrid = new DaysGrid(
			this.contentEl,
			this.settings.weekStart,
			this.settings.displayMode,
			this.settings.dotThreshold,
			(date) => void this.handleDayClick(date)
		);
		this.daysGrid.render(this.currentDate, dateCounts);
	}

	private navigateMonth(direction: -1 | 1): void {
		this.currentDate = dayjs(this.currentDate).add(direction, "month").toDate();
		void this.renderCalendar();
	}

	private goToToday(): void {
		this.currentDate = new Date();
		void this.renderCalendar();
	}

	private async handleDayClick(date: Date): Promise<void> {
		const existingNote = findDailyNote(date);

		if (existingNote) {
			await this.app.workspace.openLinkText(existingNote.path, "", false);
			return;
		}

		if (this.settings.confirmBeforeCreate) {
			const dateStr = dayjs(date).format(DATE_FORMAT);
			new ConfirmModal(
				this.app,
				this.plugin.i18n,
				dateStr,
				() => void this.createDailyNote(date)
			).open();
		} else {
			await this.createDailyNote(date);
		}
	}

	private async createDailyNote(date: Date): Promise<void> {
		await openOrCreateDailyNote(this.app, this.plugin.i18n, date);
	}

	private async fetchDateCounts(): Promise<DateCount[]> {
		const { dateSource, ignoredFolders, dateFieldName, filenameDateFormat } = this.settings;

		if (dateSource === DATE_SOURCE.FILENAME) {
			return getNotesCountByFilenameDate(this.app, ignoredFolders, filenameDateFormat);
		}
		return getNotesCountByYamlDate(this.app, ignoredFolders, dateFieldName);
	}
}
