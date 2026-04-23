import dayjs from "dayjs";
import { WeekStart, DisplayMode } from "../settings/types";
import {
	formatDate,
	isSameDay,
	isBeforeToday,
	getYearMonth,
	getDaysInMonth,
	getPreviousMonthLastDay,
	calculatePaddingDays,
} from "../utils/date";
import { CSS_CLASSES, ATTRS, GRID } from "../constants";
import {
	DisplayStrategy,
	DisplayStrategyFactory,
	DayDisplayConfig,
	DisplayContext,
} from "../display";

export type DayClickHandler = (date: Date) => void;

export interface DateCount {
	date: string;
	count: number;
}

export class DaysGrid {
	private dateCounts = new Map<string, number>();
	private gridEl: HTMLElement | null = null;
	private currentDate: Date = new Date();
	private strategy: DisplayStrategy | null = null;

	constructor(
		private container: HTMLElement,
		private weekStart: WeekStart,
		private displayMode: DisplayMode,
		private dotThreshold: number,
		private onDayClick?: DayClickHandler
	) {
		this.updateStrategy();
	}

	render(currentDate: Date, dateCounts?: DateCount[]): void {
		this.dateCounts = new Map(dateCounts?.map(d => [d.date, d.count]));
		this.currentDate = currentDate;

		this.gridEl = this.container.createDiv({ cls: CSS_CLASSES.DAYS });
		const { year, month } = getYearMonth(currentDate);
		const daysInMonth = getDaysInMonth(year, month);
		const paddingDays = calculatePaddingDays(year, month, this.weekStart);
		const today = dayjs();

		this.renderMonthDays(this.gridEl, year, month, paddingDays, daysInMonth, today);
	}

	updateDisplay(dateCounts: DateCount[]): void {
		this.dateCounts = new Map(dateCounts.map(d => [d.date, d.count]));
		if (!this.gridEl) return;

		const maxCount = this.getMaxCount();
		const today = dayjs();

		this.gridEl.querySelectorAll(`.${CSS_CLASSES.DAY}`).forEach(dayEl => {
			const dateStr = dayEl.getAttribute(ATTRS.DATA_DATE);
			if (!dateStr) return;

			const date = dayjs(dateStr);
			const count = this.dateCounts.get(dateStr) || 0;
			const isToday = isSameDay(date, today);
			const isBeforeTodayFlag = isBeforeToday(date);

			this.cleanupDayDisplay(dayEl as HTMLElement);

			// Re-apply today highlight classes
			dayEl.toggleClass(CSS_CLASSES.DAY_TODAY, isToday);
			if (this.displayMode !== "heatmap") {
				dayEl.toggleClass(CSS_CLASSES.DAY_TODAY_THEMED, isToday);
			}

			if (this.strategy) {
				const config: DayDisplayConfig = { count, isToday, isBeforeToday: isBeforeTodayFlag };
				const context: DisplayContext = { maxCount, dotThreshold: this.dotThreshold, dateStr };
				this.strategy.apply(dayEl as HTMLElement, config, context);
			}
		});
	}

	setDisplayMode(mode: DisplayMode): void {
		this.displayMode = mode;
		this.updateStrategy();
	}

	setDotThreshold(threshold: number): void {
		this.dotThreshold = threshold;
	}

	private updateStrategy(): void {
		if (this.displayMode === "none") {
			this.strategy = null;
		} else {
			this.strategy = DisplayStrategyFactory.get(this.displayMode) || null;
		}
	}

	private cleanupDayDisplay(dayEl: HTMLElement): void {
		if (this.strategy) {
			this.strategy.cleanup(dayEl);
		}
	}

	private renderMonthDays(
		grid: HTMLElement,
		year: number,
		month: number,
		paddingDays: number,
		daysInMonth: number,
		today: dayjs.Dayjs
	): void {
		const maxCount = this.getMaxCount();
		let cellCount = 0;

		// Previous month padding days
		if (paddingDays > 0) {
			const lastDay = getPreviousMonthLastDay(year, month);
			for (let i = paddingDays - 1; i >= 0; i--) {
				const date = dayjs(new Date(year, month - 1, lastDay - i));
				this.renderDay(grid, date, true, today, maxCount);
				cellCount++;
			}
		}

		// Current month days
		for (let day = 1; day <= daysInMonth; day++) {
			const date = dayjs(new Date(year, month, day));
			this.renderDay(grid, date, false, today, maxCount);
			cellCount++;
		}

		// Next month padding days
		const remainingCells = GRID.TOTAL_CELLS - cellCount;
		for (let day = 1; day <= remainingCells; day++) {
			const date = dayjs(new Date(year, month + 1, day));
			this.renderDay(grid, date, true, today, maxCount);
		}
	}

	private renderDay(
		grid: HTMLElement,
		date: dayjs.Dayjs,
		isOtherMonth: boolean,
		today: dayjs.Dayjs,
		maxCount: number
	): void {
		const count = this.dateCounts.get(formatDate(date)) || 0;
		const isTodayFlag = isSameDay(date, today);
		const isBeforeTodayFlag = isBeforeToday(date);

		const classes = isOtherMonth
			? `${CSS_CLASSES.DAY} ${CSS_CLASSES.DAY_OTHER_MONTH}`
			: CSS_CLASSES.DAY;

		const dayEl = grid.createDiv({ cls: classes });
		dayEl.textContent = String(date.date());
		dayEl.setAttribute(ATTRS.DATA_DATE, formatDate(date));

		if (this.onDayClick) {
			dayEl.addEventListener("click", () => this.onDayClick!(date.toDate()));
		}

		if (isTodayFlag) {
			dayEl.addClass(CSS_CLASSES.DAY_TODAY);
			if (this.displayMode !== "heatmap") {
				dayEl.addClass(CSS_CLASSES.DAY_TODAY_THEMED);
			}
		}

		if (this.strategy) {
			const config: DayDisplayConfig = { count, isToday: isTodayFlag, isBeforeToday: isBeforeTodayFlag };
			const context: DisplayContext = { maxCount, dotThreshold: this.dotThreshold, dateStr: formatDate(date) };
			this.strategy.apply(dayEl, config, context);
		}
	}

	private getMaxCount(): number {
		return Math.max(0, ...this.dateCounts.values());
	}
}
