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
	calculateNextMonthDays,
	getAdjacentMonth,
} from "../utils/dateUtils";
import { CSS_CLASSES, CSS_VARS, ATTRS, DOTS } from "../constants";

/**
 * Callback function type for day click events
 */
export type DayClickHandler = (date: Date) => void;

/**
 * Interface representing the count of notes for a specific date
 */
export interface DateCount {
	/** Date string in YYYY-MM-DD format */
	date: string;
	/** Number of notes for this date */
	count: number;
}

/** Configuration for rendering dots */
interface DotsConfig {
	count: number;
	isToday: boolean;
	isBeforeToday: boolean;
}

/**
 * Renders the days grid for the calendar.
 * Displays days of the current month, plus padding days from previous/next months.
 * Supports heatmap visualization and dots display modes.
 */
export class DaysGrid {
	private container: HTMLElement;
	private weekStart: WeekStart;
	private displayMode: DisplayMode;
	private dotThreshold: number;
	private dateCounts: Map<string, number> = new Map();
	private onDayClick?: DayClickHandler;

	constructor(
		container: HTMLElement,
		weekStart: WeekStart,
		displayMode: DisplayMode,
		dotThreshold: number = 1,
		onDayClick?: DayClickHandler
	) {
		this.container = container;
		this.weekStart = weekStart;
		this.displayMode = displayMode;
		this.dotThreshold = dotThreshold;
		this.onDayClick = onDayClick;
	}

	/**
	 * Renders the days grid for the specified month.
	 * @param currentDate - The date representing the month to display
	 * @param dateCounts - Array of date-count pairs for heatmap (optional)
	 */
	render(currentDate: Date, dateCounts?: DateCount[]): void {
		this.initializeDateCounts(dateCounts);

		const daysGrid = this.container.createDiv({ cls: CSS_CLASSES.DAYS });
		const { year, month } = getYearMonth(currentDate);
		const daysInMonth = getDaysInMonth(year, month);
		const paddingDays = calculatePaddingDays(year, month, this.weekStart);
		const maxCount = this.getMaxCount();
		const today = dayjs();

		this.renderPreviousMonthDays(daysGrid, year, month, paddingDays, today);
		this.renderCurrentMonthDays(daysGrid, year, month, daysInMonth, paddingDays, maxCount, today);
		this.renderNextMonthDays(daysGrid, year, month, paddingDays, daysInMonth, today);
	}

	/**
	 * Initializes the date counts map from array.
	 */
	private initializeDateCounts(dateCounts?: DateCount[]): void {
		this.dateCounts.clear();
		if (!dateCounts) return;

		for (const item of dateCounts) {
			this.dateCounts.set(item.date, item.count);
		}
	}

	/**
	 * Renders padding days from the previous month.
	 */
	private renderPreviousMonthDays(
		daysGrid: HTMLElement,
		year: number,
		month: number,
		paddingDays: number,
		today: dayjs.Dayjs
	): void {
		if (paddingDays === 0) return;

		const prevMonthLastDay = getPreviousMonthLastDay(year, month);
		const { year: prevYear, month: prevMonth } = getAdjacentMonth(year, month, -1);

		for (let i = paddingDays - 1; i >= 0; i--) {
			const day = prevMonthLastDay - i;
			const date = dayjs(new Date(prevYear, prevMonth, day));
			const dayEl = this.createDayElement(daysGrid, day, true, date);

			if (this.displayMode === "dots") {
				this.renderDotsIfNeeded(dayEl, date, today);
			}
		}
	}

	/**
	 * Renders days of the current month.
	 */
	private renderCurrentMonthDays(
		daysGrid: HTMLElement,
		year: number,
		month: number,
		daysInMonth: number,
		paddingDays: number,
		maxCount: number,
		today: dayjs.Dayjs
	): void {
		for (let day = 1; day <= daysInMonth; day++) {
			const date = dayjs(new Date(year, month, day));
			const dayEl = this.createDayElement(daysGrid, day, false, date);

			const config = this.createDayConfig(date, today);

			if (config.isToday) {
				dayEl.addClass(CSS_CLASSES.DAY_TODAY);
			}

			this.applyDisplayMode(dayEl, date, config, maxCount);
		}
	}

	/**
	 * Renders padding days from the next month.
	 */
	private renderNextMonthDays(
		daysGrid: HTMLElement,
		year: number,
		month: number,
		paddingDays: number,
		daysInMonth: number,
		today: dayjs.Dayjs
	): void {
		const nextMonthDays = calculateNextMonthDays(paddingDays, daysInMonth);
		if (nextMonthDays <= 0) return;

		const { year: nextYear, month: nextMonth } = getAdjacentMonth(year, month, 1);

		for (let day = 1; day <= nextMonthDays; day++) {
			const date = dayjs(new Date(nextYear, nextMonth, day));
			const dayEl = this.createDayElement(daysGrid, day, true, date);

			if (this.displayMode === "dots") {
				this.renderDotsIfNeeded(dayEl, date, today);
			}
		}
	}

	/**
	 * Creates a day element with appropriate classes.
	 */
	private createDayElement(daysGrid: HTMLElement, day: number, isOtherMonth: boolean, date?: dayjs.Dayjs): HTMLElement {
		const classes = isOtherMonth
			? `${CSS_CLASSES.DAY} ${CSS_CLASSES.DAY_OTHER_MONTH}`
			: CSS_CLASSES.DAY;
		const dayEl = daysGrid.createDiv({ cls: classes });
		dayEl.textContent = day.toString();

		// Add click handler if provided and date is available
		if (this.onDayClick && date) {
			dayEl.addEventListener("click", () => {
				this.onDayClick!(date.toDate());
			});
		}

		return dayEl;
	}

	/**
	 * Creates configuration for a day's display state.
	 */
	private createDayConfig(date: dayjs.Dayjs, today: dayjs.Dayjs): DotsConfig {
		return {
			count: this.getDateCount(date),
			isToday: isSameDay(date, today),
			isBeforeToday: isBeforeToday(date),
		};
	}

	/**
	 * Applies display mode specific styling to a day element.
	 */
	private applyDisplayMode(
		dayEl: HTMLElement,
		date: dayjs.Dayjs,
		config: DotsConfig,
		maxCount: number
	): void {
		const dateStr = formatDate(date);

		if (this.displayMode === "heatmap") {
			this.applyHeatmapMode(dayEl, date, config, maxCount, dateStr);
		} else if (this.displayMode === "dots") {
			this.applyDotsMode(dayEl, date, config, dateStr);
		}

		// Apply themed today styling for non-heatmap modes
		if (config.isToday && this.displayMode !== "heatmap") {
			dayEl.addClass(CSS_CLASSES.DAY_TODAY_THEMED);
		}
	}

	/**
	 * Applies heatmap mode styling.
	 */
	private applyHeatmapMode(
		dayEl: HTMLElement,
		date: dayjs.Dayjs,
		config: DotsConfig,
		maxCount: number,
		dateStr: string
	): void {
		if (config.count > 0) {
			dayEl.addClass(CSS_CLASSES.DAY_HEATMAP);
			const opacity = calculateHeatmapOpacity(config.count, maxCount);
			dayEl.style.setProperty(CSS_VARS.HEATMAP_OPACITY, opacity.toFixed(2));
			dayEl.setAttribute(ATTRS.DATA_COUNT, config.count.toString());
			dayEl.setAttribute(ATTRS.ARIA_LABEL, `${dateStr}: ${config.count} notes`);
		}

		// Add today indicator dot for heatmap mode
		if (config.isToday) {
			const todayIndicator = dayEl.createDiv({ cls: CSS_CLASSES.DOTS_CONTAINER });
			todayIndicator.createDiv({ cls: `${CSS_CLASSES.DOT} ${CSS_CLASSES.DOT_TODAY}` });
			todayIndicator.setAttribute(ATTRS.ARIA_HIDDEN, "true");
		}
	}

	/**
	 * Applies dots mode styling.
	 */
	private applyDotsMode(dayEl: HTMLElement, date: dayjs.Dayjs, config: DotsConfig, dateStr: string): void {
		this.renderDots(dayEl, config);
		if (config.count > 0 || config.isBeforeToday) {
			dayEl.setAttribute(ATTRS.ARIA_LABEL, `${dateStr}: ${config.count} notes`);
		}
	}

	/**
	 * Renders dots for a day element if in dots mode.
	 */
	private renderDotsIfNeeded(dayEl: HTMLElement, date: dayjs.Dayjs, today: dayjs.Dayjs): void {
		if (this.displayMode !== "dots") return;

		const config: DotsConfig = {
			count: this.getDateCount(date),
			isToday: isSameDay(date, today),
			isBeforeToday: isBeforeToday(date),
		};
		this.renderDots(dayEl, config);
	}

	/**
	 * Renders dots below the date to represent note count.
	 */
	private renderDots(dayEl: HTMLElement, config: DotsConfig): void {
		const dotsContainer = dayEl.createDiv({ cls: CSS_CLASSES.DOTS_CONTAINER });

		if (config.count > 0) {
			const numDots = calculateDotCount(config.count, this.dotThreshold, DOTS.MAX_DOTS);
			for (let i = 0; i < numDots; i++) {
				dotsContainer.createDiv({ cls: CSS_CLASSES.DOT });
			}
		} else if (config.isBeforeToday) {
			dotsContainer.createDiv({ cls: `${CSS_CLASSES.DOT} ${CSS_CLASSES.DOT_GRAY}` });
		}
	}

	/**
	 * Gets the note count for a specific date.
	 */
	private getDateCount(date: dayjs.Dayjs): number {
		return this.dateCounts.get(formatDate(date)) || 0;
	}

	/**
	 * Finds the maximum note count in the current dataset.
	 */
	private getMaxCount(): number {
		let max = 0;
		for (const count of this.dateCounts.values()) {
			if (count > max) max = count;
		}
		return max;
	}
}
