import { ItemView, WorkspaceLeaf } from "obsidian";
import dayjs from "dayjs";
import { I18n } from "./i18n";
import { CalendarHeader } from "./ui/CalendarHeader";
import { WeekdaysRow } from "./ui/WeekdaysRow";
import { DaysGrid, DateCount } from "./ui/DaysGrid";
import { ConfirmModal } from "./ui/ConfirmModal";
import { CalendarZSettings, DEFAULT_SETTINGS } from "./settings/index";
import { getNotesCountByYamlDate, getNotesCountByFilenameDate } from "./utils/GetNotes";
import { createDailyNote, findDailyNote } from "./utils/createNote";
import { CSS_CLASSES, ATTRS } from "./constants";
import CalendarZ from "./main";

export const CALENDARZ_VIEW_TYPE = "calendarz-view";

export class CalendarZView extends ItemView {
	private currentDate = new Date();
	private i18n: I18n;
	private settings: CalendarZSettings;
	private plugin: CalendarZ;
	private daysGrid: DaysGrid | null = null;

	constructor(leaf: WorkspaceLeaf, i18n: I18n, settings: CalendarZSettings, plugin: CalendarZ) {
		super(leaf);
		this.i18n = i18n;
		this.settings = { ...DEFAULT_SETTINGS, ...settings };
		this.plugin = plugin;
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

	updateSettings(i18n: I18n, settings: CalendarZSettings): void {
		this.i18n = i18n;
		this.settings = settings;
		void this.renderCalendar();
	}

	async onOpen(): Promise<void> {
		await this.renderCalendar();
	}

	async onClose(): Promise<void> {
		this.contentEl.empty();
	}

	async refreshStatsOnly(): Promise<void> {
		if (this.settings.displayMode === "none") return;

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

		const todayStr = today.format("YYYY-MM-DD");
		this.contentEl.querySelectorAll(`.${CSS_CLASSES.DAY}`).forEach(el => {
			const isToday = el.getAttribute(ATTRS.DATA_DATE) === todayStr;
			el.toggleClass(CSS_CLASSES.DAY_TODAY, isToday);
			if (this.settings.displayMode !== "heatmap") {
				el.toggleClass(CSS_CLASSES.DAY_TODAY_THEMED, isToday);
			}
		});
	}

	private async renderCalendar(): Promise<void> {
		this.contentEl.empty();
		this.contentEl.addClass(CSS_CLASSES.CONTAINER);

		new CalendarHeader(
			this.contentEl,
			this.i18n,
			this.settings.monthFormat,
			this.settings.language,
			this.settings.titleFormat,
			{
				onPrevMonth: () => this.navigateMonth(-1),
				onNextMonth: () => this.navigateMonth(1),
				onToday: () => this.goToToday(),
			}
		).render(this.currentDate);

		new WeekdaysRow(this.contentEl, this.i18n, this.settings.weekStart).render();

		const dateCounts = this.settings.displayMode !== "none"
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
			const dateStr = dayjs(date).format("YYYY-MM-DD");
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
		await createDailyNote(this.plugin, date);
	}

	private async fetchDateCounts(): Promise<DateCount[]> {
		const { dateSource, ignoredFolders, dateFieldName, filenameDateFormat } = this.settings;

		if (dateSource === "filename") {
			return getNotesCountByFilenameDate(this.app, ignoredFolders, filenameDateFormat);
		}
		return getNotesCountByYamlDate(this.app, ignoredFolders, dateFieldName);
	}
}
