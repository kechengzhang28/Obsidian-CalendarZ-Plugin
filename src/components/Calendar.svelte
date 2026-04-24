<script lang="ts">
	import dayjs from "dayjs";
	import CalendarHeader from "./CalendarHeader.svelte";
	import WeekdaysRow from "./WeekdaysRow.svelte";
	import DaysGrid from "./DaysGrid.svelte";
	import type { I18n } from "../i18n";
	import type {
		CalendarZSettings,
		WeekStart,
		DisplayMode,
	} from "../settings/types";
	import { CSS_CLASSES, DISPLAY_MODE, DATE_FORMAT } from "../constants";
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

	<WeekdaysRow {i18n} weekStart={settings.weekStart} />

	<DaysGrid
		{currentDate}
		weekStart={settings.weekStart}
		displayMode={settings.displayMode}
		dotThreshold={settings.dotThreshold}
		heatmapMaxNotes={settings.heatmapMaxNotes}
		{dateCounts}
		{onDayClick}
	/>
</div>
