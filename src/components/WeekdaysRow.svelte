<script lang="ts">
	import type { I18n } from "../i18n";
	import type { WeekStart } from "../settings/types";

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

<div class="calendarz-weekdays" class:calendarz-weekdays-with-week={showWeekNumber}>
	{#if showWeekNumber}
		<span class="calendarz-weekday calendarz-weekday-label">{i18n.calendar.weekLabel}</span>
	{/if}
	{#each orderedWeekdays as day}
		<span class="calendarz-weekday">{day}</span>
	{/each}
</div>
