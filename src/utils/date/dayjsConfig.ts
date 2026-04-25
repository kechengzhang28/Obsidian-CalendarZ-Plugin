import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import customParseFormat from "dayjs/plugin/customParseFormat";
import updateLocale from "dayjs/plugin/updateLocale";

// Register dayjs plugins
dayjs.extend(weekOfYear);
dayjs.extend(customParseFormat);
dayjs.extend(updateLocale);

/** Tracks the last applied week-start value to avoid redundant locale mutations. */
let _currentWeekStartDow: number | undefined;

/**
 * Updates dayjs locale to set week start day.
 * Memoized: no-ops when the value has not changed since the last call,
 * preventing repeated global locale mutations (e.g., per-cell during render).
 * @param weekStart - "sunday" or "monday"
 */
export function setWeekStart(weekStart: "sunday" | "monday"): void {
	const dow = weekStart === "sunday" ? 0 : 1;
	if (dow === _currentWeekStartDow) return;
	_currentWeekStartDow = dow;
	dayjs.updateLocale("en", {
		weekStart: dow,
	});
}

export default dayjs;
