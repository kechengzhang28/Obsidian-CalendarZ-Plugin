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
 * Converts format pattern to regex for date extraction.
 * Maps format tokens to regex capture groups.
 */
const FORMAT_TOKEN_MAP: Record<string, { regex: string; parser: (v: string) => number }> = {
	YYYY: { regex: "(\\d{4})", parser: v => parseInt(v, 10) },
	YY: { 
		regex: "(\\d{2})", 
		parser: v => {
			const year = parseInt(v, 10);
			const currentYear = dayjs().year();
			const currentCentury = Math.floor(currentYear / 100) * 100;
			const fullYear = currentCentury + year;
			return fullYear > currentYear + 50 ? fullYear - 100 : fullYear;
		}
	},
	MM: { regex: "(\\d{2})", parser: v => parseInt(v, 10) },
	M: { regex: "(\\d{1,2})", parser: v => parseInt(v, 10) },
	DD: { regex: "(\\d{2})", parser: v => parseInt(v, 10) },
	D: { regex: "(\\d{1,2})", parser: v => parseInt(v, 10) },
};

/**
 * Extracts a date from a filename based on a format pattern.
 * Uses a simpler approach: convert format to regex and extract values.
 */
function extractDateFromFilename(filename: string, format: string): Date | null {
	// Find all format tokens and their positions
	const tokens: { type: string; pos: number }[] = [];
	
	for (const token of Object.keys(FORMAT_TOKEN_MAP)) {
		const pos = format.indexOf(token);
		if (pos !== -1) tokens.push({ type: token, pos });
	}
	
	// Sort by position and remove duplicates (prefer longer tokens)
	tokens.sort((a, b) => a.pos - b.pos);
	const uniqueTokens: typeof tokens = [];
	for (const token of tokens) {
		const lastToken = uniqueTokens[uniqueTokens.length - 1];
		if (!lastToken || token.pos !== lastToken.pos) {
			uniqueTokens.push(token);
		}
	}
	
	if (uniqueTokens.length < 3) return null; // Need at least year, month, day

	// Build regex pattern
	let regexPattern = "^.*";
	let lastEnd = 0;

	for (const token of uniqueTokens) {
		if (token.pos > lastEnd) {
			const separator = format.slice(lastEnd, token.pos);
			regexPattern += separator.replace(/[-/.]/g, "[-/.]");
		}
		const tokenConfig = FORMAT_TOKEN_MAP[token.type];
		if (tokenConfig) {
			regexPattern += tokenConfig.regex;
		}
		lastEnd = token.pos + token.type.length;
	}
	regexPattern += ".*$";

	const match = filename.match(new RegExp(regexPattern));
	if (!match) return null;

	// Extract date components
	let year: number | null = null;
	let month: number | null = null;
	let day: number | null = null;

	for (let i = 0; i < uniqueTokens.length; i++) {
		const token = uniqueTokens[i];
		if (!token) continue;
		
		const value = match[i + 1];
		if (!value) continue;

		const tokenConfig = FORMAT_TOKEN_MAP[token.type];
		if (!tokenConfig) continue;
		
		const parsed = tokenConfig.parser(value);
		
		if (token.type.startsWith("Y")) year = parsed;
		else if (token.type.startsWith("M")) month = parsed;
		else if (token.type.startsWith("D")) day = parsed;
	}

	if (year === null || month === null || day === null) return null;

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
