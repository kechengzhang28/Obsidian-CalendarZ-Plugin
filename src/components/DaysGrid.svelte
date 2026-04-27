<script lang="ts">
	import dayjs from "../utils/date/dayjsConfig";
	import type { WeekStart, DisplayMode } from "../core/types";
	import {
		formatDate,
		isSameDay,
		isBeforeToday,
		getYearMonth,
		getDaysInMonth,
		getPreviousMonthLastDay,
		calculatePaddingDays,
		getWeekNumber,
	} from "../utils/date";
	import { CSS_CLASSES, GRID, DOTS, HEATMAP } from "../core/constants";
	import type { DateCount, DateTodoStatus, WeekTodoStatus } from "./types";

	interface Props {
		currentDate: Date;
		weekStart: WeekStart;
		displayMode: DisplayMode;
		dotThreshold: number;
		heatmapMaxNotes: number;
		heatmapHideDateNumbers: boolean;
		showWeekNumber: boolean;
		weekNoteEnabled: boolean;
		hideCompletedTodos: boolean;
		isWordCount: boolean;
		dateCounts: DateCount[];
		todoStatuses: DateTodoStatus[];
		weekTodoStatuses: WeekTodoStatus[];
		countsMap: Map<string, number>;
		todoMap: Map<string, DateTodoStatus>;
		weekTodoMap: Map<string, WeekTodoStatus>;
		onDayClick: (date: Date) => void;
		onWeekClick: (date: Date) => void;
		hasWeekNote?: (date: Date) => boolean;
	}

let {
	currentDate,
	weekStart,
	displayMode,
	dotThreshold,
	heatmapMaxNotes,
	heatmapHideDateNumbers,
	showWeekNumber,
	weekNoteEnabled,
	hideCompletedTodos,
	isWordCount,
	dateCounts,
	todoStatuses,
	weekTodoStatuses,
	countsMap,
	todoMap,
	weekTodoMap,
	onDayClick,
	onWeekClick,
	hasWeekNote,
}: Props = $props();

	const today = $derived(dayjs());

	interface DayCell {
		date: dayjs.Dayjs;
		isOtherMonth: boolean;
		count: number;
		isToday: boolean;
		isBeforeToday: boolean;
		dateStr: string;
		weekNumber: number;
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
			weekNumber: getWeekNumber(date.toDate(), weekStart),
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

	/**
	 * Returns the week-numbering year for a given date and its computed week number.
	 * Works for both Sunday-start (US) and Monday-start (ISO-like) week numbering,
	 * since both conventions define week 1 as the week that contains January 1.
	 *
	 * Year-boundary corrections:
	 *  - weekNum === 1  in December  → the week belongs to the following year  (year + 1)
	 *  - weekNum >= 52 in January    → the week belongs to the preceding year  (year − 1)
	 */
	function getWeekYear(date: dayjs.Dayjs, weekNum: number): number {
		const month = date.month(); // 0-based: 11 = December, 0 = January
		const year = date.year();
		if (weekNum === 1 && month === 11) return year + 1;
		if (weekNum >= 52 && month === 0) return year - 1;
		return year;
	}

	let rows = $derived.by(() => {
		const result: { weekNumber: number; weekKey: string; cells: DayCell[] }[] = [];
		for (let i = 0; i < cells.length; i += GRID.DAYS_PER_WEEK) {
			const rowCells = cells.slice(i, i + GRID.DAYS_PER_WEEK);
			const firstCell = rowCells[0];
			const weekNum = firstCell.weekNumber;
			const weekYear = getWeekYear(firstCell.date, weekNum);
			const weekKey = `${weekYear}-W${weekNum.toString().padStart(2, "0")}`;
			result.push({
				weekNumber: weekNum,
				weekKey,
				cells: rowCells,
			});
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
		if (displayMode === "heatmap") {
			if (cell.count > 0) {
				classes.push(CSS_CLASSES.DAY_HEATMAP);
			} else {
				classes.push(CSS_CLASSES.DAY_HEATMAP_EMPTY);
			}
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

	function handleWeekClick(row: { weekNumber: number; cells: DayCell[] }) {
		if (weekNoteEnabled && row.cells.length > 0) {
			// Use the first day of the week to identify the week
			onWeekClick(row.cells[0].date.toDate());
		}
	}

	function getWeekNoteDotType(row: { weekNumber: number; cells: DayCell[] }): "normal" | "gray" | "" {
		if (!weekNoteEnabled || displayMode !== "dots" || !hasWeekNote || row.cells.length === 0) {
			return "";
		}
		const firstDay = row.cells[0];
		const hasNote = hasWeekNote(firstDay.date.toDate());
		const isCurrentWeek = row.cells.some(cell => cell.isToday);
		const isBeforeCurrentWeek = firstDay.date.isBefore(today, "week");

		if (hasNote) {
			return "normal";
		} else if (isCurrentWeek) {
			return ""; // Current week without note: no dot
		} else if (isBeforeCurrentWeek) {
			return "gray";
		}
		return "";
	}

	function getTodoStatusClass(cell: DayCell): string {
		const todoStatus = todoMap.get(cell.dateStr);
		if (!todoStatus) return "";

		if (todoStatus.allCompleted) {
			return `${CSS_CLASSES.TODO} ${CSS_CLASSES.TODO_COMPLETED}`;
		} else {
			return `${CSS_CLASSES.TODO} ${CSS_CLASSES.TODO_PENDING}`;
		}
	}

	function hasTodoStatus(cell: DayCell): boolean {
		const todoStatus = todoMap.get(cell.dateStr);
		if (!todoStatus) return false;
		if (hideCompletedTodos && todoStatus.allCompleted) return false;
		return true;
	}

	function getWeekTodoStatusClass(row: { weekNumber: number; weekKey: string; cells: DayCell[] }): string {
		const weekTodoStatus = weekTodoMap.get(row.weekKey);
		if (!weekTodoStatus) return "";
		if (hideCompletedTodos && weekTodoStatus.allCompleted) return "";

		if (weekTodoStatus.allCompleted) {
			return `${CSS_CLASSES.TODO} ${CSS_CLASSES.TODO_COMPLETED}`;
		} else {
			return `${CSS_CLASSES.TODO} ${CSS_CLASSES.TODO_PENDING}`;
		}
	}

	function hasWeekTodoStatus(row: { weekNumber: number; weekKey: string; cells: DayCell[] }): boolean {
		const weekTodoStatus = weekTodoMap.get(row.weekKey);
		if (!weekTodoStatus) return false;
		if (hideCompletedTodos && weekTodoStatus.allCompleted) return false;
		return true;
	}
</script>

<div class={CSS_CLASSES.DAYS} class:calendarz__days--with-week={showWeekNumber}>
	{#each rows as row (row.cells[0]?.dateStr ?? `${getYearMonth(currentDate)}-week-${row.weekNumber}`)}
		{#if showWeekNumber}
			{#if weekNoteEnabled}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div
					class="{CSS_CLASSES.WEEK_NUMBER} {CSS_CLASSES.WEEK_NUMBER_CLICKABLE}"
					role="button"
					tabindex="0"
					onclick={() => handleWeekClick(row)}
				>
					{row.weekNumber}
					{#if getWeekNoteDotType(row) || hasWeekTodoStatus(row)}
						<div class={CSS_CLASSES.DOTS} aria-hidden="true">
							{#if getWeekNoteDotType(row) === "normal"}
								<div class={CSS_CLASSES.DOT}></div>
							{:else if getWeekNoteDotType(row) === "gray"}
								<div class="{CSS_CLASSES.DOT} {CSS_CLASSES.DOT_MUTED}"></div>
							{/if}
							{#if hasWeekTodoStatus(row)}
								<div class={getWeekTodoStatusClass(row)}></div>
							{/if}
						</div>
					{/if}
				</div>
			{:else}
				<div class={CSS_CLASSES.WEEK_NUMBER}>
					{row.weekNumber}
					{#if hasWeekTodoStatus(row)}
						<div class={CSS_CLASSES.DOTS} aria-hidden="true">
							<div class={getWeekTodoStatusClass(row)}></div>
						</div>
					{/if}
				</div>
			{/if}
		{/if}
		<!-- 
			Key includes current month to prevent DOM reuse across months.
			This fixes a flickering issue where other-month dates briefly 
			appeared with wrong color during month navigation.
		-->
		{#each row.cells as cell (`${cell.dateStr}-${currentDate.getMonth()}`)}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<div
				class={getDayClasses(cell)}
				style={getDayStyle(cell)}
				data-date={cell.dateStr}
				data-count={cell.count > 0 ? cell.count : undefined}
				aria-label={cell.count > 0 || cell.isBeforeToday
					? `${cell.dateStr}: ${cell.count} ${isWordCount ? "words" : "notes"}`
					: undefined}
				role="button"
				tabindex="0"
				onclick={() => handleClick(cell)}
			>
				{#if !(displayMode === "heatmap" && heatmapHideDateNumbers)}
					{cell.date.date()}
				{/if}

				{#if getDotCount(cell) > 0 || showGrayDot(cell) || (showTodayIndicator(cell) && !heatmapHideDateNumbers) || hasTodoStatus(cell)}
					<div class={CSS_CLASSES.DOTS} aria-hidden="true">
						{#if showTodayIndicator(cell)}
							<div class="{CSS_CLASSES.INDICATOR} {CSS_CLASSES.INDICATOR_BAR}"></div>
						{:else if showGrayDot(cell)}
							<div class="{CSS_CLASSES.DOT} {CSS_CLASSES.DOT_MUTED}"></div>
						{:else}
							{#each Array(getDotCount(cell)) as _, i (i)}
								<div class={CSS_CLASSES.DOT}></div>
							{/each}
						{/if}
						{#if hasTodoStatus(cell)}
							<div class={getTodoStatusClass(cell)}></div>
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	{/each}
</div>
