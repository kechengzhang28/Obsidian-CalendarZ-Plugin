import {App, parseYaml} from "obsidian";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import {DateCount} from "../ui/DaysGrid";
import {DATE_FORMAT} from "../constants";

dayjs.extend(customParseFormat);

/**
 * Checks if a file path should be ignored based on the ignored folders list.
 */
function isPathIgnored(filePath: string, ignoredFolders: string[]): boolean {
	const normalizedPath = filePath.replace(/\\/g, "/");
	return ignoredFolders.some(folder => {
		const normalizedFolder = folder.replace(/\\/g, "/").replace(/\/$/, "");
		return normalizedPath === normalizedFolder || normalizedPath.startsWith(normalizedFolder + "/");
	});
}

/**
 * Parses a date string using multiple common formats.
 */
function parseDateString(dateStr: string): Date | null {
	if (!dateStr) return null;

	const formats = ["YYYY-MM-DD", "YYYY/MM/DD", "DD-MM-YYYY", "DD/MM/YYYY", "MM-DD-YYYY", "MM/DD/YYYY"];
	
	for (const format of formats) {
		const parsed = dayjs(dateStr, format, true);
		if (parsed.isValid()) return parsed.toDate();
	}

	const isoParsed = dayjs(dateStr);
	return isoParsed.isValid() ? isoParsed.toDate() : null;
}

/**
 * Extracts a date from a filename based on a format pattern.
 * Supports YYYY-MM-DD format variations.
 */
function extractDateFromFilename(filename: string, format: string): Date | null {
	// Simple approach: convert format to regex for YYYY-MM-DD style patterns
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
 * Extracts YAML frontmatter from file content.
 */
function extractYamlFrontmatter(content: string): Record<string, unknown> | null {
	const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
	if (!match?.[1]) return null;

	try {
		const parsed = parseYaml(match[1]) as Record<string, unknown> | null;
		return parsed || {};
	} catch {
		return null;
	}
}

/**
 * Parses a YAML date value into a Date object.
 */
function parseYamlDate(dateValue: unknown): Date | null {
	if (typeof dateValue === "string") {
		return parseDateString(dateValue);
	}
	if (dateValue instanceof Date) {
		return dateValue;
	}
	if (typeof dateValue === "number") {
		return dayjs(dateValue).toDate();
	}
	if (dateValue && typeof dateValue === "object") {
		const obj = dateValue as Record<string, unknown>;
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
 * Converts a Map of date counts to DateCount array.
 */
function mapToDateCounts(dateCount: Map<string, number>): DateCount[] {
	return Array.from(dateCount.entries()).map(([date, count]) => ({ date, count }));
}

/**
 * Gets note counts grouped by date extracted from filenames.
 */
export async function getNotesCountByFilenameDate(
	app: App,
	ignoredFolders: string[],
	filenameDateFormat: string
): Promise<DateCount[]> {
	const dateCount = new Map<string, number>();

	for (const file of app.vault.getFiles()) {
		if (isPathIgnored(file.path, ignoredFolders)) continue;

		const filename = file.name.replace(/\.[^/.]+$/, "");
		const date = extractDateFromFilename(filename, filenameDateFormat);

		if (date) {
			const dateStr = dayjs(date).format(DATE_FORMAT);
			dateCount.set(dateStr, (dateCount.get(dateStr) || 0) + 1);
		}
	}

	return mapToDateCounts(dateCount);
}

/**
 * Gets note counts grouped by date from YAML frontmatter.
 */
export async function getNotesCountByYamlDate(
	app: App,
	ignoredFolders: string[],
	dateFieldName: string
): Promise<DateCount[]> {
	const dateCount = new Map<string, number>();

	for (const file of app.vault.getMarkdownFiles()) {
		if (isPathIgnored(file.path, ignoredFolders)) continue;

		try {
			const content = await app.vault.read(file);
			const frontmatter = extractYamlFrontmatter(content);
			
			if (!frontmatter?.[dateFieldName]) continue;

			const date = parseYamlDate(frontmatter[dateFieldName]);
			if (date) {
				const dateStr = dayjs(date).format(DATE_FORMAT);
				dateCount.set(dateStr, (dateCount.get(dateStr) || 0) + 1);
			}
		} catch {
			// Skip files that can't be read
		}
	}

	return mapToDateCounts(dateCount);
}
