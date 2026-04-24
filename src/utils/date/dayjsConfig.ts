import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import customParseFormat from "dayjs/plugin/customParseFormat";
import updateLocale from "dayjs/plugin/updateLocale";

// Register dayjs plugins
dayjs.extend(weekOfYear);
dayjs.extend(customParseFormat);
dayjs.extend(updateLocale);

/**
 * Updates dayjs locale to set week start day
 * @param weekStart - "sunday" or "monday"
 */
export function setWeekStart(weekStart: "sunday" | "monday"): void {
	const dow = weekStart === "sunday" ? 0 : 1;
	dayjs.updateLocale("en", {
		weekStart: dow,
	});
}

export default dayjs;
