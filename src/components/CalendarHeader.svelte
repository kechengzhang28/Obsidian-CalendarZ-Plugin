<script lang="ts">
	import dayjs from "../utils/date/dayjsConfig";
	import { formatMonth } from "../utils/date";
	import type { I18n } from "../i18n";
	import type { MonthFormat, TitleFormat } from "../settings/types";

	interface Props {
		i18n: I18n;
		monthFormat: MonthFormat;
		language: string;
		titleFormat: TitleFormat;
		currentDate: Date;
		onPrevMonth: () => void;
		onNextMonth: () => void;
		onToday: () => void;
	}

	let {
		i18n,
		monthFormat,
		language,
		titleFormat,
		currentDate,
		onPrevMonth,
		onNextMonth,
		onToday
	}: Props = $props();

	let yearText = $derived(dayjs(currentDate).year().toString());
	let monthText = $derived(formatMonth(currentDate, language, monthFormat));
	let [firstText, secondText] = $derived(
		titleFormat === "yearMonth"
			? [yearText, monthText]
			: [monthText, yearText]
	);
</script>

<div class="calendarz-header">
	<div class="calendarz-month-year">
		<span class="calendarz-month">{firstText}</span>
		<span class="calendarz-year">{secondText}</span>
	</div>

	<button
		class="calendarz-nav-btn"
		onclick={onPrevMonth}
		aria-label="Previous month"
		type="button"
	>
		<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
			<polyline points="15 18 9 12 15 6" />
		</svg>
	</button>

	<button
		class="calendarz-today-btn"
		onclick={onToday}
		type="button"
	>
		{i18n.calendar.today}
	</button>

	<button
		class="calendarz-nav-btn"
		onclick={onNextMonth}
		aria-label="Next month"
		type="button"
	>
		<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
			<polyline points="9 18 15 12 9 6" />
		</svg>
	</button>
</div>
