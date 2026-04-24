<script lang="ts">
	import dayjs from "../utils/date/dayjsConfig";
	import CalendarHeader from "./CalendarHeader.svelte";
	import WeekdaysRow from "./WeekdaysRow.svelte";
	import DaysGrid from "./DaysGrid.svelte";
	import type { I18n } from "../i18n";
	import type {
		CalendarZSettings,
		WeekStart,
		DisplayMode,
		StatisticsType,
	} from "../settings/types";
	import { CSS_CLASSES, DISPLAY_MODE, DATE_FORMAT, STATISTICS_TYPE } from "../constants";
	import type { DateCount } from "./types";

	interface Props {
		settings: CalendarZSettings;
		i18n: I18n;
		dateCounts: DateCount[];
		onDayClick: (date: Date) => void;
		onNavigateMonth: (direction: -1 | 1) => void;
		onGoToToday: () => void;
		currentDate: Date;
	}

	let {
		settings,
		i18n,
		dateCounts,
		onDayClick,
		onNavigateMonth,
		onGoToToday,
		currentDate,
	}: Props = $props();

	// Determine which thresholds to use based on statistics type
	const isWordCount = $derived(settings.statisticsType === STATISTICS_TYPE.WORD_COUNT);
	const effectiveDotThreshold = $derived(isWordCount ? settings.dotWordThreshold : settings.dotThreshold);
	const effectiveHeatmapMax = $derived(isWordCount ? settings.heatmapMaxWords : settings.heatmapMaxNotes);
</script>

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
		dotThreshold={effectiveDotThreshold}
		heatmapMaxNotes={effectiveHeatmapMax}
		heatmapHideDateNumbers={settings.heatmapHideDateNumbers}
		showWeekNumber={settings.showWeekNumber}
		{dateCounts}
		{onDayClick}
	/>
</div>
