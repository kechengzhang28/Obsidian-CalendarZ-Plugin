<script lang="ts">
	import type { I18n } from "../i18n";
	import type { WeekStart } from "../core/types";
	import { CSS_CLASSES } from "../core/constants";

	interface Props {
		i18n: I18n;
		weekStart: WeekStart;
		showWeekNumber: boolean;
	}

	let { i18n, weekStart, showWeekNumber }: Props = $props();

	let orderedWeekdays = $derived.by(() => {
		const days = [...i18n.calendar.weekdays];
		if (weekStart === "monday") {
			const sunday = days.shift();
			if (sunday) days.push(sunday);
		}
		return days;
	});
</script>

<div class={CSS_CLASSES.WEEKDAYS} class:calendarz__weekdays--with-week={showWeekNumber}>
	{#if showWeekNumber}
		<span class="{CSS_CLASSES.WEEKDAY} {CSS_CLASSES.WEEKDAY_LABEL}">{i18n.calendar.weekLabel}</span>
	{/if}
	{#each orderedWeekdays as day}
		<span class={CSS_CLASSES.WEEKDAY}>{day}</span>
	{/each}
</div>
