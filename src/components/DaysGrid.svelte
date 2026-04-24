<script lang="ts">
	import dayjs from "dayjs";
	import type { WeekStart, DisplayMode } from "../settings/types";
	import {
		formatDate,
		isSameDay,
		isBeforeToday,
		getYearMonth,
		getDaysInMonth,
		getPreviousMonthLastDay,
		calculatePaddingDays,
	} from "../utils/date";
	import { CSS_CLASSES, ATTRS, GRID, DOTS, HEATMAP } from "../constants";
	import type { DateCount } from "./types";

	interface Props {
		currentDate: Date;
		weekStart: WeekStart;
		displayMode: DisplayMode;
		dotThreshold: number;
		heatmapMaxNotes: number;
		dateCounts: DateCount[];
		onDayClick: (date: Date) => void;
	}

	let {
		currentDate,
		weekStart,
		displayMode,
		dotThreshold,
		heatmapMaxNotes,
		dateCounts,
		onDayClick,
	}: Props = $props();

	const countsMap = $derived(
		new Map(dateCounts.map((d) => [d.date, d.count]))
	);

	const today = $derived(dayjs());

	interface DayCell {
		date: dayjs.Dayjs;
		isOtherMonth: boolean;
		count: number;
		isToday: boolean;
		isBeforeToday: boolean;
		dateStr: string;
	}

	function calculateHeatmapOpacity(count: number, maxNotes: number): number {
		if (maxNotes <= 0) return HEATMAP.MIN_OPACITY;
		const intensity = Math.min(count / maxNotes, 1);
		return HEATMAP.MIN_OPACITY + intensity * HEATMAP.OPACITY_RANGE;
	}

	function calculateDotCount(count: number, threshold: number, maxDots: number): number {
		if (count <= 0) return 0;
		return Math.min(maxDots, Math.ceil(count / threshold));
	}

	function createDayCell(date: dayjs.Dayjs, isOtherMonth: boolean): DayCell {
		const dateStr = formatDate(date);
		return {
			date,
			isOtherMonth,
			count: countsMap.get(dateStr) || 0,
			isToday: isSameDay(date, today),
			isBeforeToday: isBeforeToday(date),
			dateStr,
		};
	}

	let cells = $derived.by((): DayCell[] => {
		const { year, month } = getYearMonth(currentDate);
		const daysInMonth = getDaysInMonth(year, month);
		const paddingDays = calculatePaddingDays(year, month, weekStart);
		const result: DayCell[] = [];

		if (paddingDays > 0) {
			const lastDay = getPreviousMonthLastDay(year, month);
			for (let i = paddingDays - 1; i >= 0; i--) {
				result.push(createDayCell(
					dayjs(new Date(year, month - 1, lastDay - i)),
					true
				));
			}
		}

		for (let day = 1; day <= daysInMonth; day++) {
			result.push(createDayCell(
				dayjs(new Date(year, month, day)),
				false
			));
		}

		const remainingCells = GRID.TOTAL_CELLS - result.length;
		for (let day = 1; day <= remainingCells; day++) {
			result.push(createDayCell(
				dayjs(new Date(year, month + 1, day)),
				true
			));
		}

		return result;
	});

	function getDayClasses(cell: DayCell): string {
		const classes = [CSS_CLASSES.DAY];
		if (cell.isOtherMonth) classes.push(CSS_CLASSES.DAY_OTHER_MONTH);
		if (cell.isToday) {
			classes.push(CSS_CLASSES.DAY_TODAY);
			if (displayMode !== "heatmap") {
				classes.push(CSS_CLASSES.DAY_TODAY_THEMED);
			}
		}
		if (displayMode === "heatmap" && cell.count > 0) {
			classes.push(CSS_CLASSES.DAY_HEATMAP);
		}
		return classes.join(" ");
	}

	function getDayStyle(cell: DayCell): string {
		if (displayMode === "heatmap" && cell.count > 0) {
			const opacity = calculateHeatmapOpacity(cell.count, heatmapMaxNotes);
			return `--heatmap-opacity: ${opacity.toFixed(2)}`;
		}
		return "";
	}

	function getDotCount(cell: DayCell): number {
		if (displayMode !== "dots") return 0;
		if (cell.count > 0) {
			return calculateDotCount(cell.count, dotThreshold, DOTS.MAX_DOTS);
		}
		return 0;
	}

	function showGrayDot(cell: DayCell): boolean {
		return displayMode === "dots" && cell.count === 0 && cell.isBeforeToday;
	}

	function showTodayIndicator(cell: DayCell): boolean {
		return (
			displayMode === "heatmap" &&
			cell.isToday
		);
	}

	function handleClick(cell: DayCell) {
		onDayClick(cell.date.toDate());
	}
</script>

<div class={CSS_CLASSES.DAYS}>
	{#each cells as cell (cell.dateStr)}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class={getDayClasses(cell)}
			style={getDayStyle(cell)}
			data-date={cell.dateStr}
			data-count={cell.count > 0 ? cell.count : undefined}
			aria-label={cell.count > 0 || cell.isBeforeToday
				? `${cell.dateStr}: ${cell.count} notes`
				: undefined}
			role="button"
			tabindex="0"
			onclick={() => handleClick(cell)}
		>
			{cell.date.date()}

			{#if getDotCount(cell) > 0 || showGrayDot(cell) || showTodayIndicator(cell)}
				<div class={CSS_CLASSES.DOTS_CONTAINER} aria-hidden="true">
					{#if showTodayIndicator(cell)}
						<div class="{CSS_CLASSES.BAR_TODAY}"></div>
					{:else if showGrayDot(cell)}
						<div class="{CSS_CLASSES.DOT} {CSS_CLASSES.DOT_GRAY}"></div>
					{:else}
						{#each Array(getDotCount(cell)) as _, i (i)}
							<div class={CSS_CLASSES.DOT}></div>
						{/each}
					{/if}
				</div>
			{/if}
		</div>
	{/each}
</div>
