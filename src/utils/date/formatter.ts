import dayjs from "./dayjsConfig";
import { DATE_FORMAT } from "../../core/constants";

/**
 * Formats a date to YYYY-MM-DD string.
 * @param date - Date to format (Date object or dayjs instance)
 * @returns Formatted date string in YYYY-MM-DD format
 */
export function formatDate(date: Date | dayjs.Dayjs): string {
	return dayjs(date).format(DATE_FORMAT);
}

/**
 * Formats a month display based on language and format preferences.
 *
 * Special handling for Chinese locale with numeric format:
 * - Returns month number (1-12) without leading zero
 * - Other locales use standard toLocaleString formatting
 *
 * @param date - Date to extract month from
 * @param language - Locale string (e.g., "en-US", "zh-CN")
 * @param format - Month format: "numeric" | "short" | "long"
 * @returns Formatted month string
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
