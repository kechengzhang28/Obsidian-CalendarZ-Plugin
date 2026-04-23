import {App, parseYaml, TFile} from "obsidian";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import {DateCount} from "../ui/DaysGrid";
import {DATE_FORMAT} from "../constants";

dayjs.extend(customParseFormat);

/**
 * Common date formats to try when parsing date strings
 * Tried in order until a valid date is found
 */
const DATE_FORMATS = [
	"YYYY-MM-DD",
	"YYYY/MM/DD",
	"DD-MM-YYYY",
	"DD/MM/YYYY",
	"MM-DD-YYYY",
	"MM/DD/YYYY"
];

/**
 * Checks if a file path should be ignored based on the ignore list
 * @param filePath - Path to check
 * @param ignoredFolders - List of folder paths to ignore
 * @returns True if the path should be ignored
 */
function isPathIgnored(filePath: string, ignoredFolders: string[]): boolean {
	const normalizedPath = filePath.replace(/\\/g, "/");
	return ignoredFolders.some(folder => {
		const normalizedFolder = folder.replace(/\\/g, "/").replace(/\/$/, "");
		return normalizedPath === normalizedFolder || normalizedPath.startsWith(normalizedFolder + "/");
	});
}

/**
 * Parses a date string using multiple common formats
 * @param dateStr - Date string to parse
 * @returns Parsed Date or null if invalid
 */
function parseDateString(dateStr: string): Date | null {
	if (!dateStr) return null;

	for (const format of DATE_FORMATS) {
		const parsed = dayjs(dateStr, format, true);
		if (parsed.isValid()) return parsed.toDate();
	}

	const isoParsed = dayjs(dateStr);
	return isoParsed.isValid() ? isoParsed.toDate() : null;
}

/**
 * Extracts a date from a filename using a format pattern
 * @param filename - Filename to parse (without extension)
 * @param format - Date format pattern (e.g., "YYYY-MM-DD")
 * @returns Parsed Date or null if not found
 */
function extractDateFromFilename(filename: string, format: string): Date | null {
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
 * Extracts YAML frontmatter from file content
 * @param content - File content
 * @returns Parsed frontmatter object or null
 */
function extractYamlFrontmatter(content: string): Record<string, unknown> | null {
	const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
	if (!match?.[1]) return null;

	try {
		const parsed = parseYaml(match[1]) as unknown;
		if (parsed && typeof parsed === "object") {
			return parsed as Record<string, unknown>;
		}
		return {};
	} catch {
		return null;
	}
}

/**
 * Parses a date value from YAML frontmatter
 * @param value - YAML value to parse
 * @returns Parsed Date or null
 */
function parseYamlDate(value: unknown): Date | null {
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

/**
 * Generic function to count notes by date
 * @param items - Items to process
 * @param isIgnored - Function to check if item should be ignored
 * @param extractDate - Function to extract date from item
 * @returns Array of date counts
 */
function countNotesByDate<T>(
	items: T[],
	isIgnored: (item: T) => boolean,
	extractDate: (item: T) => Date | null
): DateCount[] {
	const counts = new Map<string, number>();

	for (const item of items) {
		if (isIgnored(item)) continue;

		const date = extractDate(item);
		if (date) {
			const dateStr = dayjs(date).format(DATE_FORMAT);
			counts.set(dateStr, (counts.get(dateStr) || 0) + 1);
		}
	}

	return Array.from(counts.entries()).map(([date, count]) => ({ date, count }));
}

/**
 * Extracts date from a file using YAML frontmatter
 * @param file - Markdown file
 * @param app - Obsidian app instance
 * @param dateFieldName - Name of the date field in frontmatter
 * @returns Promise resolving to Date or null
 */
async function extractDateFromYaml(
	file: TFile,
	app: App,
	dateFieldName: string
): Promise<Date | null> {
	try {
		const content = await app.vault.read(file);
		const frontmatter = extractYamlFrontmatter(content);
		const dateValue = frontmatter?.[dateFieldName];

		if (!dateValue) return null;

		return parseYamlDate(dateValue);
	} catch (error) {
		// Log error for debugging but don't throw
		console.warn(`Failed to read file ${file.path}:`, error);
		return null;
	}
}

/**
 * Counts notes by date extracted from filenames
 * @param app - Obsidian app instance
 * @param ignoredFolders - List of folder paths to ignore
 * @param filenameDateFormat - Date format pattern in filenames
 * @returns Array of date counts
 */
export function getNotesCountByFilenameDate(
	app: App,
	ignoredFolders: string[],
	filenameDateFormat: string
): DateCount[] {
	return countNotesByDate(
		app.vault.getFiles(),
		file => isPathIgnored(file.path, ignoredFolders),
		file => extractDateFromFilename(file.name.replace(/\.[^/.]+$/, ""), filenameDateFormat)
	);
}

/**
 * Counts notes by date extracted from YAML frontmatter
 * @param app - Obsidian app instance
 * @param ignoredFolders - List of folder paths to ignore
 * @param dateFieldName - Name of the date field in frontmatter
 * @returns Promise resolving to array of date counts
 */
export async function getNotesCountByYamlDate(
	app: App,
	ignoredFolders: string[],
	dateFieldName: string
): Promise<DateCount[]> {
	const files = app.vault.getMarkdownFiles();
	const datePromises = files.map(async (file) => {
		if (isPathIgnored(file.path, ignoredFolders)) {
			return null;
		}

		const date = await extractDateFromYaml(file, app, dateFieldName);
		if (!date) return null;

		return dayjs(date).format(DATE_FORMAT);
	});

	const dates = await Promise.all(datePromises);
	const counts = new Map<string, number>();

	for (const dateStr of dates) {
		if (dateStr) {
			counts.set(dateStr, (counts.get(dateStr) || 0) + 1);
		}
	}

	return Array.from(counts.entries()).map(([date, count]) => ({ date, count }));
}
