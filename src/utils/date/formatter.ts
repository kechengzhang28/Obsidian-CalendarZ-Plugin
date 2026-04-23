import dayjs from "dayjs";
import { DATE_FORMAT } from "../../constants";

/**
 * Formats a date to YYYY-MM-DD string
 */
export function formatDate(date: Date | dayjs.Dayjs): string {
	return dayjs(date).format(DATE_FORMAT);
}

/**
 * Formats a date using a custom format string
 */
export function formatDateWithFormat(date: Date | dayjs.Dayjs, format: string): string {
	return dayjs(date).format(format);
}

/**
 * Formats a month display based on language and format preferences
 */
export function formatMonth(
	date: Date,
	language: string,
	format: "numeric" | "short" | "long"
): string {
	if (language === "zh-CN" && format === "numeric") {
		return (dayjs(date).month() + 1).toString();
	}
	return dayjs(date).toDate().toLocaleString(language, { month: format });
}
