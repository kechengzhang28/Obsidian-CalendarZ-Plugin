<script lang="ts">
	import dayjs from "../utils/date/dayjsConfig";
	import { formatMonth } from "../utils/date";
	import type { I18n } from "../i18n";
	import type { MonthFormat, TitleFormat } from "../core/types";

	interface Props {
		i18n: I18n;
		monthFormat: MonthFormat;
		language: string;
		titleFormat: TitleFormat;
		currentDate: Date;
		monthNoteEnabled: boolean;
		yearNoteEnabled: boolean;
		onPrevMonth: () => void;
		onNextMonth: () => void;
		onToday: () => void;
		onMonthClick: () => void;
		onYearClick: () => void;
	}

	let {
		i18n,
		monthFormat,
		language,
		titleFormat,
		currentDate,
		monthNoteEnabled,
		yearNoteEnabled,
		onPrevMonth,
		onNextMonth,
		onToday,
		onMonthClick,
		onYearClick,
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
		{#if titleFormat === "yearMonth"}
			<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
			<span
				class="calendarz-year"
				class:calendarz-year-clickable={yearNoteEnabled}
				onclick={yearNoteEnabled ? onYearClick : undefined}
				role={yearNoteEnabled ? "button" : undefined}
			>
				{yearText}
			</span>
			<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
			<span
				class="calendarz-month"
				class:calendarz-month-clickable={monthNoteEnabled}
				onclick={monthNoteEnabled ? onMonthClick : undefined}
				role={monthNoteEnabled ? "button" : undefined}
			>
				{monthText}
			</span>
		{:else}
			<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
			<span
				class="calendarz-month"
				class:calendarz-month-clickable={monthNoteEnabled}
				onclick={monthNoteEnabled ? onMonthClick : undefined}
				role={monthNoteEnabled ? "button" : undefined}
			>
				{monthText}
			</span>
			<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
			<span
				class="calendarz-year"
				class:calendarz-year-clickable={yearNoteEnabled}
				onclick={yearNoteEnabled ? onYearClick : undefined}
				role={yearNoteEnabled ? "button" : undefined}
			>
				{yearText}
			</span>
		{/if}
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
