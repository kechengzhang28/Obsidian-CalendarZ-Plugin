import dayjs from "dayjs";
import { WeekStart, DisplayMode } from "../settings/types";
import {
	formatDate,
	isSameDay,
	isBeforeToday,
	getYearMonth,
	getDaysInMonth,
	getPreviousMonthLastDay,
	calculateHeatmapOpacity,
	calculateDotCount,
	calculatePaddingDays,
} from "../utils/dateUtils";
import { CSS_CLASSES, CSS_VARS, ATTRS, DOTS, GRID } from "../constants";

export type DayClickHandler = (date: Date) => void;

export interface DateCount {
	date: string;
	count: number;
}

interface DayConfig {
	count: number;
	isToday: boolean;
	isBeforeToday: boolean;
}

export class DaysGrid {
	private dateCounts = new Map<string, number>();
	private gridEl: HTMLElement | null = null;
	private currentDate: Date = new Date();

	constructor(
		private container: HTMLElement,
		private weekStart: WeekStart,
		private displayMode: DisplayMode,
		private dotThreshold: number,
		private onDayClick?: DayClickHandler
	) {}

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
			const todayFlag = isSameDay(date, today);
			const beforeTodayFlag = isBeforeToday(date);

			const config: DayConfig = { count, isToday: todayFlag, isBeforeToday: beforeTodayFlag };
			this.updateDayDisplay(dayEl as HTMLElement, date, config, maxCount);
		});
	}

	private updateDayDisplay(
		dayEl: HTMLElement,
		date: dayjs.Dayjs,
		config: DayConfig,
		maxCount: number
	): void {
		const dateStr = formatDate(date);

		// Clear existing display mode content
		dayEl.removeClass(CSS_CLASSES.DAY_HEATMAP);
		dayEl.style.removeProperty(CSS_VARS.HEATMAP_OPACITY);
		dayEl.removeAttribute(ATTRS.DATA_COUNT);
		dayEl.querySelectorAll(`.${CSS_CLASSES.DOTS_CONTAINER}`).forEach(el => el.remove());

		// Re-apply display mode
		switch (this.displayMode) {
			case "heatmap":
				this.applyHeatmap(dayEl, config, maxCount, dateStr);
				break;
			case "dots":
				this.applyDots(dayEl, config, dateStr);
				break;
		}

		// Update aria-label
		if (config.count > 0 || config.isBeforeToday) {
			dayEl.setAttribute(ATTRS.ARIA_LABEL, `${dateStr}: ${config.count} notes`);
		} else {
			dayEl.removeAttribute(ATTRS.ARIA_LABEL);
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
		const config: DayConfig = {
			count: this.dateCounts.get(formatDate(date)) || 0,
			isToday: isSameDay(date, today),
			isBeforeToday: isBeforeToday(date),
		};

		const classes = isOtherMonth
			? `${CSS_CLASSES.DAY} ${CSS_CLASSES.DAY_OTHER_MONTH}`
			: CSS_CLASSES.DAY;

		const dayEl = grid.createDiv({ cls: classes });
		dayEl.textContent = String(date.date());
		dayEl.setAttribute(ATTRS.DATA_DATE, formatDate(date));

		if (this.onDayClick) {
			dayEl.addEventListener("click", () => this.onDayClick!(date.toDate()));
		}

		if (config.isToday) {
			dayEl.addClass(CSS_CLASSES.DAY_TODAY);
		}

		this.applyDisplayMode(dayEl, date, config, maxCount);
	}

	private applyDisplayMode(
		dayEl: HTMLElement,
		date: dayjs.Dayjs,
		config: DayConfig,
		maxCount: number
	): void {
		const dateStr = formatDate(date);

		switch (this.displayMode) {
			case "heatmap":
				this.applyHeatmap(dayEl, config, maxCount, dateStr);
				break;
			case "dots":
				this.applyDots(dayEl, config, dateStr);
				break;
		}

		if (config.isToday && this.displayMode !== "heatmap") {
			dayEl.addClass(CSS_CLASSES.DAY_TODAY_THEMED);
		}
	}

	private applyHeatmap(dayEl: HTMLElement, config: DayConfig, maxCount: number, dateStr: string): void {
		if (config.count === 0) {
			if (config.isToday) {
				this.addTodayIndicator(dayEl);
			}
			return;
		}

		dayEl.addClass(CSS_CLASSES.DAY_HEATMAP);
		const opacity = calculateHeatmapOpacity(config.count, maxCount);
		dayEl.style.setProperty(CSS_VARS.HEATMAP_OPACITY, opacity.toFixed(2));
		dayEl.setAttribute(ATTRS.DATA_COUNT, String(config.count));
		dayEl.setAttribute(ATTRS.ARIA_LABEL, `${dateStr}: ${config.count} notes`);

		if (config.isToday) {
			this.addTodayIndicator(dayEl);
		}
	}

	private applyDots(dayEl: HTMLElement, config: DayConfig, dateStr: string): void {
		const container = dayEl.createDiv({ cls: CSS_CLASSES.DOTS_CONTAINER });

		if (config.count > 0) {
			const numDots = calculateDotCount(config.count, this.dotThreshold, DOTS.MAX_DOTS);
			for (let i = 0; i < numDots; i++) {
				container.createDiv({ cls: CSS_CLASSES.DOT });
			}
		} else if (config.isBeforeToday) {
			container.createDiv({ cls: `${CSS_CLASSES.DOT} ${CSS_CLASSES.DOT_GRAY}` });
		}

		if (config.count > 0 || config.isBeforeToday) {
			dayEl.setAttribute(ATTRS.ARIA_LABEL, `${dateStr}: ${config.count} notes`);
		}
	}

	private addTodayIndicator(dayEl: HTMLElement): void {
		const indicator = dayEl.createDiv({ cls: CSS_CLASSES.DOTS_CONTAINER });
		indicator.createDiv({ cls: `${CSS_CLASSES.DOT} ${CSS_CLASSES.DOT_TODAY}` });
		indicator.setAttribute(ATTRS.ARIA_HIDDEN, "true");
	}

	private getMaxCount(): number {
		return Math.max(0, ...this.dateCounts.values());
	}
}
