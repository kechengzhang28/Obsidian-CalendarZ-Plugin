<script lang="ts">
	import dayjs from "../utils/date/dayjsConfig";
	import CalendarHeader from "./CalendarHeader.svelte";
	import WeekdaysRow from "./WeekdaysRow.svelte";
	import DaysGrid from "./DaysGrid.svelte";
	import type { I18n } from "../i18n";
	import type {
		CalendarZSettings,
	} from "../core/types";
	import { STATISTICS_TYPE, CSS_CLASSES } from "../core/constants";
	import type { CalendarState } from "../stores/calendarState.svelte";

	interface Props {
		state: CalendarState;
		onDayClick: (date: Date) => void;
		onWeekClick: (date: Date) => void;
		onNavigateMonth: (direction: -1 | 1) => void;
		onGoToToday: () => void;
		hasWeekNote: (date: Date) => boolean;
	}

	let {
		state,
		onDayClick,
		onWeekClick,
		onNavigateMonth,
		onGoToToday,
		hasWeekNote,
	}: Props = $props();

	// Derived values from state - automatically update when state changes
	const settings = $derived(state.settings);
	const i18n = $derived(state.i18n);
	const currentDate = $derived(state.currentDate);
	const dateCounts = $derived(state.dateCounts);
	const todoStatuses = $derived(state.todoStatuses);
	const weekTodoStatuses = $derived(state.weekTodoStatuses);

	// Determine which thresholds to use based on statistics type
	const isWordCount = $derived(settings?.statisticsType === STATISTICS_TYPE.WORD_COUNT);
	const effectiveDotThreshold = $derived(
		isWordCount ? settings?.dotWordThreshold : settings?.dotThreshold
	);
	const effectiveHeatmapMax = $derived(
		isWordCount ? settings?.heatmapMaxWords : settings?.heatmapMaxNotes
	);
</script>

{#if settings && i18n}
	<div class={CSS_CLASSES.CONTAINER}>
		<CalendarHeader
			{i18n}
			monthFormat={settings.monthFormat}
			language={settings.language}
			titleFormat={settings.titleFormat}
			{currentDate}
			onPrevMonth={() => onNavigateMonth(-1)}
			onNextMonth={() => onNavigateMonth(1)}
			onToday={onGoToToday}
		/>

		<WeekdaysRow {i18n} weekStart={settings.weekStart} showWeekNumber={settings.showWeekNumber} />

		<DaysGrid
			{currentDate}
			weekStart={settings.weekStart}
			displayMode={settings.displayMode}
			dotThreshold={effectiveDotThreshold ?? 1}
			heatmapMaxNotes={effectiveHeatmapMax ?? 10}
			heatmapHideDateNumbers={settings.heatmapHideDateNumbers}
			showWeekNumber={settings.showWeekNumber}
			weekNoteEnabled={settings.weekNoteEnabled}
			{dateCounts}
			{todoStatuses}
			{weekTodoStatuses}
			{onDayClick}
			{onWeekClick}
			{hasWeekNote}
		/>
	</div>
{/if}
