import {App, parseYaml} from "obsidian";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

export interface NoteInfo {
	path: string;
	name: string;
	created: Date;
	modified: Date;
}

export interface DateCount {
	date: string;
	count: number;
}

/**
 * Check if a file path is in the ignored folders
 * @param filePath File path
 * @param ignoredFolders List of ignored folder paths
 * @returns Whether the path is ignored
 */
export function isPathIgnored(filePath: string, ignoredFolders: string[]): boolean {
	for (const ignoredFolder of ignoredFolders) {
		const normalizedIgnored = ignoredFolder.replace(/\\/g, "/").replace(/\/$/, "");
		const normalizedPath = filePath.replace(/\\/g, "/");

		if (normalizedPath === normalizedIgnored ||
			normalizedPath.startsWith(normalizedIgnored + "/")) {
			return true;
		}
	}
	return false;
}

/**
 * Get all notes that are not in ignored folders
 * @param app Obsidian App instance
 * @param ignoredFolders List of ignored folder paths
 * @returns List of note information
 */
export function getAllNotes(app: App, ignoredFolders: string[]): NoteInfo[] {
	const notes: NoteInfo[] = [];
	const files = app.vault.getFiles();

	for (const file of files) {
		if (isPathIgnored(file.path, ignoredFolders)) {
			continue;
		}

		notes.push({
			path: file.path,
			name: file.name,
			created: new Date(file.stat.ctime),
			modified: new Date(file.stat.mtime)
		});
	}

	return notes;
}

/**
 * Get note counts grouped by date
 * @param app Obsidian App instance
 * @param ignoredFolders List of ignored folder paths
 * @param dateType Date type: 'created' or 'modified'
 * @returns Map of date to count
 */
export function getNotesCountByDate(
	app: App,
	ignoredFolders: string[],
	dateType: "created" | "modified" = "created"
): Map<string, number> {
	const notes = getAllNotes(app, ignoredFolders);
	const dateCount = new Map<string, number>();

	for (const note of notes) {
		const date = dateType === "created" ? note.created : note.modified;
		const dateStr = dayjs(date).format("YYYY-MM-DD");

		const count = dateCount.get(dateStr) || 0;
		dateCount.set(dateStr, count + 1);
	}

	return dateCount;
}

/**
 * Get notes within a specified date range
 * @param app Obsidian App instance
 * @param ignoredFolders List of ignored folder paths
 * @param startDate Start date
 * @param endDate End date
 * @param dateType Date type: 'created' or 'modified'
 * @returns List of note information
 */
export function getNotesInDateRange(
	app: App,
	ignoredFolders: string[],
	startDate: Date,
	endDate: Date,
	dateType: "created" | "modified" = "created"
): NoteInfo[] {
	const notes = getAllNotes(app, ignoredFolders);
	const start = dayjs(startDate);
	const end = dayjs(endDate);

	return notes.filter(note => {
		const date = dateType === "created" ? note.created : note.modified;
		const d = dayjs(date);
		return d.isAfter(start) || d.isSame(start, "day") && 
			(d.isBefore(end) || d.isSame(end, "day"));
	});
}

/**
 * Parse date string to Date object
 * Supports formats: YYYY-MM-DD, YYYY/MM/DD, DD-MM-YYYY, etc.
 * @param dateStr Date string
 * @returns Date object or null if invalid
 */
function parseDateString(dateStr: string): Date | null {
	if (!dateStr) return null;

	const formats = [
		"YYYY-MM-DD",
		"YYYY/MM/DD",
		"DD-MM-YYYY",
		"DD/MM/YYYY",
		"MM-DD-YYYY",
		"MM/DD/YYYY",
	];

	for (const format of formats) {
		const parsed = dayjs(dateStr, format, true);
		if (parsed.isValid()) {
			return parsed.toDate();
		}
	}

	// Try ISO format as fallback
	const isoParsed = dayjs(dateStr);
	if (isoParsed.isValid()) {
		return isoParsed.toDate();
	}

	return null;
}

/**
 * Convert format pattern to dayjs format for parsing
 * @param format Format pattern like "YYYY-MM-DD"
 * @returns dayjs format string
 */
function normalizeFormat(format: string): string {
	return format
		.replace(/YYYY/g, "YYYY")
		.replace(/YY/g, "YY")
		.replace(/MM/g, "MM")
		.replace(/M/g, "M")
		.replace(/DD/g, "DD")
		.replace(/D/g, "D");
}

/**
 * Extract date from filename based on format pattern
 * @param filename Filename without extension
 * @param format Format pattern like "YYYY-MM-DD"
 * @returns Date object or null if not found
 */
export function extractDateFromFilename(filename: string, format: string): Date | null {
	const normalizedFormat = normalizeFormat(format);
	
	// Try to find the date pattern in the filename
	// Build a regex to extract the date components based on the format
	const formatTokens: { type: string; pos: number }[] = [];
	const formatPattern = normalizedFormat;
	
	// Find positions of each token
	const year4Pos = formatPattern.indexOf("YYYY");
	const year2Pos = formatPattern.indexOf("YY");
	const month2Pos = formatPattern.indexOf("MM");
	const month1Pos = formatPattern.indexOf("M");
	const day2Pos = formatPattern.indexOf("DD");
	const day1Pos = formatPattern.indexOf("D");
	
	if (year4Pos !== -1) formatTokens.push({ type: "YYYY", pos: year4Pos });
	else if (year2Pos !== -1) formatTokens.push({ type: "YY", pos: year2Pos });
	
	if (month2Pos !== -1) formatTokens.push({ type: "MM", pos: month2Pos });
	else if (month1Pos !== -1) formatTokens.push({ type: "M", pos: month1Pos });
	
	if (day2Pos !== -1) formatTokens.push({ type: "DD", pos: day2Pos });
	else if (day1Pos !== -1) formatTokens.push({ type: "D", pos: day1Pos });
	
	// Sort by position
	formatTokens.sort((a, b) => a.pos - b.pos);
	
	// Build regex pattern
	let regexPattern = "";
	let lastEnd = 0;
	
	for (const token of formatTokens) {
		// Add separator before this token
		if (token.pos > lastEnd) {
			const separator = formatPattern.slice(lastEnd, token.pos);
			regexPattern += separator.replace(/[-/.]/g, "[-/.]");
		}
		
		// Add capture group for the token
		switch (token.type) {
			case "YYYY":
				regexPattern += "(\\d{4})";
				break;
			case "YY":
				regexPattern += "(\\d{2})";
				break;
			case "MM":
				regexPattern += "(\\d{2})";
				break;
			case "M":
				regexPattern += "(\\d{1,2})";
				break;
			case "DD":
				regexPattern += "(\\d{2})";
				break;
			case "D":
				regexPattern += "(\\d{1,2})";
				break;
		}
		
		lastEnd = token.pos + token.type.length;
	}
	
	// Match from the beginning of the string, allow any characters after the date pattern
	regexPattern = "^.*" + regexPattern + ".*$";
	
	const regex = new RegExp(regexPattern);
	const match = filename.match(regex);
	
	if (!match) return null;
	
	// Extract values based on token order
	let year: number | null = null;
	let month: number | null = null;
	let day: number | null = null;
	
	for (let i = 0; i < formatTokens.length; i++) {
		const token = formatTokens[i];
		if (!token) continue;
		
		const value = match[i + 1];
		if (!value) continue;
		
		switch (token.type) {
			case "YYYY":
				year = parseInt(value, 10);
				break;
			case "YY": {
				year = parseInt(value, 10);
				// Handle 2-digit year
				const currentYear = dayjs().year();
				const currentCentury = Math.floor(currentYear / 100) * 100;
				year = currentCentury + year;
				if (year > currentYear + 50) {
					year -= 100;
				}
				break;
			}
			case "MM":
			case "M":
				month = parseInt(value, 10);
				break;
			case "DD":
			case "D":
				day = parseInt(value, 10);
				break;
		}
	}
	
	if (year === null || month === null || day === null) return null;
	
	const date = dayjs(`${year}-${month}-${day}`, "YYYY-M-D", true);
	if (!date.isValid()) return null;
	
	return date.toDate();
}

/**
 * Get note counts grouped by date from filename
 * @param app Obsidian App instance
 * @param ignoredFolders List of ignored folder paths
 * @param filenameDateFormat Format pattern for date in filename (e.g., "YYYY-MM-DD")
 * @returns Array of DateCount
 */
export async function getNotesCountByFilenameDate(
	app: App,
	ignoredFolders: string[],
	filenameDateFormat: string
): Promise<DateCount[]> {
	const files = app.vault.getFiles();
	const dateCount = new Map<string, number>();

	for (const file of files) {
		if (isPathIgnored(file.path, ignoredFolders)) {
			continue;
		}

		// Get filename without extension
		const filename = file.name.replace(/\.[^/.]+$/, "");
		const date = extractDateFromFilename(filename, filenameDateFormat);

		if (date) {
			const dateStr = dayjs(date).format("YYYY-MM-DD");
			const count = dateCount.get(dateStr) || 0;
			dateCount.set(dateStr, count + 1);
		}
	}

	const result: DateCount[] = [];
	for (const [date, count] of dateCount.entries()) {
		result.push({ date, count });
	}

	return result;
}

/**
 * Extract YAML frontmatter from file content
 * @param content File content
 * @returns Parsed YAML object or null
 */
function extractYamlFrontmatter(content: string): Record<string, unknown> | null {
	const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
	if (!match || !match[1]) return null;

	try {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return parseYaml(match[1]) || {};
	} catch {
		return null;
	}
}

/**
 * Get note counts grouped by date from YAML frontmatter
 * @param app Obsidian App instance
 * @param ignoredFolders List of ignored folder paths
 * @param dateFieldName Name of the date field in YAML frontmatter
 * @returns Array of DateCount
 */
export async function getNotesCountByYamlDate(
	app: App,
	ignoredFolders: string[],
	dateFieldName: string
): Promise<DateCount[]> {
	const files = app.vault.getMarkdownFiles();
	const dateCount = new Map<string, number>();

	for (const file of files) {
		if (isPathIgnored(file.path, ignoredFolders)) {
			continue;
		}

		try {
			const content = await app.vault.read(file);
			const frontmatter = extractYamlFrontmatter(content);

			if (!frontmatter || !(dateFieldName in frontmatter)) {
				continue;
			}

			const dateValue = frontmatter[dateFieldName];
			let date: Date | null = null;

			if (typeof dateValue === "string") {
				date = parseDateString(dateValue);
			} else if (dateValue instanceof Date) {
				date = dateValue;
			} else if (typeof dateValue === "number") {
				// Handle timestamp
				date = dayjs(dateValue).toDate();
			} else if (dateValue && typeof dateValue === "object") {
				// Handle Obsidian's parsed date object (may have different structure)
				// Try to extract date from various possible formats
				const obj = dateValue as Record<string, unknown>;
				if ("year" in obj && "month" in obj && "day" in obj) {
					const year = String(obj.year);
					const month = String(obj.month);
					const day = String(obj.day);
					date = dayjs(`${year}-${month}-${day}`, "YYYY-M-D").toDate();
				}
			}

			if (date) {
				const dateStr = dayjs(date).format("YYYY-MM-DD");
				const count = dateCount.get(dateStr) || 0;
				dateCount.set(dateStr, count + 1);
			}
		} catch {
			// Skip files that can't be read
			continue;
		}
	}

	const result: DateCount[] = [];
	for (const [date, count] of dateCount.entries()) {
		result.push({ date, count });
	}

	return result;
}
