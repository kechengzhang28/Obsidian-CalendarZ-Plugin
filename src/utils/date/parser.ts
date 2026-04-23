import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

const DATE_FORMATS = [
	"YYYY-MM-DD",
	"YYYY/MM/DD",
	"DD-MM-YYYY",
	"DD/MM/YYYY",
	"MM-DD-YYYY",
	"MM/DD/YYYY",
];

/**
 * Parses a date string using multiple common formats
 * @param dateStr - Date string to parse
 * @returns Parsed Date or null if invalid
 */
export function parseDateString(dateStr: string): Date | null {
	if (!dateStr) return null;

	for (const format of DATE_FORMATS) {
		const parsed = dayjs(dateStr, format, true);
		if (parsed.isValid()) return parsed.toDate();
	}

	const isoParsed = dayjs(dateStr);
	return isoParsed.isValid() ? isoParsed.toDate() : null;
}

/**
 * Parses a date from a filename using a format pattern
 * @param filename - Filename to parse
 * @param format - Date format pattern (e.g., "YYYY-MM-DD")
 * @returns Parsed Date or null if not found
 */
export function parseDateFromFilename(filename: string, format: string): Date | null {
	const pattern = format
		.replace(/YYYY/g, "(\\d{4})")
		.replace(/MM/g, "(\\d{2})")
		.replace(/DD/g, "(\\d{2})")
		.replace(/[-/.]/g, "[-/.]");

	const regex = new RegExp(`^.*${pattern}.*$`);
	const match = filename.match(regex);

	if (!match) return null;

	const year = parseInt(match[1] ?? "0", 10);
	const month = parseInt(match[2] ?? "0", 10);
	const day = parseInt(match[3] ?? "0", 10);
	const date = dayjs(`${year}-${month}-${day}`, "YYYY-M-D", true);
	return date.isValid() ? date.toDate() : null;
}

/**
 * Parses a date value from YAML frontmatter
 * @param value - YAML value (could be string, Date, number, or object)
 * @returns Parsed Date or null
 */
export function parseYamlDate(value: unknown): Date | null {
	if (value instanceof Date) return value;
	if (typeof value === "string") return parseDateString(value);
	if (typeof value === "number") return dayjs(value).toDate();

	if (value && typeof value === "object") {
		const obj = value as Record<string, unknown>;
		if ("year" in obj && "month" in obj && "day" in obj) {
			const year = String(obj.year);
			const month = String(obj.month);
			const day = String(obj.day);
			const date = dayjs(`${year}-${month}-${day}`, "YYYY-M-D");
			return date.isValid() ? date.toDate() : null;
		}
	}
	return null;
}
