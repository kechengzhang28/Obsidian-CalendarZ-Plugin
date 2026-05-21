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
 * - Portuguese locale uses special formatting
 *
 * @param date - Date to extract month from
 * @param language - Locale string (e.g., "en-US", "zh-CN", "pt-BR")
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
	} else if (language === "pt-BR") {
		if (format === "short") {
			return dayjs(date).toDate().toLocaleString(language, { month: "short" }).toUpperCase().slice(0, 3);	
		} else if (format === "long") {	
			return dayjs(date).toDate().toLocaleString(language, { month: "long" }).charAt(0).toUpperCase() + dayjs(date).toDate().toLocaleString(language, { month: "long" }).slice(1);
		}
	}
	return dayjs(date).toDate().toLocaleString(language, { month: format });
}
