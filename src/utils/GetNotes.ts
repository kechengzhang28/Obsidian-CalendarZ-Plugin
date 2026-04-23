import {App, parseYaml} from "obsidian";

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
		const dateStr = formatDateKey(date);

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
	const start = startDate.getTime();
	const end = endDate.getTime();

	return notes.filter(note => {
		const date = dateType === "created" ? note.created : note.modified;
		const time = date.getTime();
		return time >= start && time <= end;
	});
}

/**
 * Format date to YYYY-MM-DD format
 * @param date Date object
 * @returns Formatted string
 */
function formatDateKey(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

/**
 * Parse date string to Date object
 * Supports formats: YYYY-MM-DD, YYYY/MM/DD, DD-MM-YYYY, etc.
 * @param dateStr Date string
 * @returns Date object or null if invalid
 */
function parseDateString(dateStr: string): Date | null {
	if (!dateStr) return null;

	// Try parsing as ISO format first
	let date = new Date(dateStr);
	if (!isNaN(date.getTime())) {
		return date;
	}

	// Try common formats
	const formats = [
		/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/,  // YYYY-MM-DD or YYYY/MM/DD
		/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/,  // DD-MM-YYYY or MM-DD-YYYY
	];

	for (const format of formats) {
		const match = dateStr.match(format);
		if (match && match[1] && match[2] && match[3]) {
			// Try YYYY-MM-DD first
			if (match[1].length === 4) {
				date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
			} else {
				// Assume DD-MM-YYYY
				date = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
			}
			if (!isNaN(date.getTime())) {
				return date;
			}
		}
	}

	return null;
}

/**
 * Convert format pattern to regex pattern
 * @param format Format pattern like "YYYY-MM-DD"
 * @returns Regex pattern string
 */
function formatToRegex(format: string): string {
	return format
		.replace(/YYYY/g, "(\\d{4})")
		.replace(/YY/g, "(\\d{2})")
		.replace(/MM/g, "(\\d{2})")
		.replace(/M/g, "(\\d{1,2})")
		.replace(/DD/g, "(\\d{2})")
		.replace(/D/g, "(\\d{1,2})")
		.replace(/[-/.]/g, "[-/.]?");
}

/**
 * Get the order of year, month, day in the format pattern
 * @param format Format pattern like "YYYY-MM-DD"
 * @returns Object with indices for year, month, day
 */
function getDateComponentOrder(format: string): { year: number; month: number; day: number } {
	const yearIndex = format.indexOf("YYYY") !== -1 ? format.indexOf("YYYY") : format.indexOf("YY");
	const monthIndex = format.indexOf("MM") !== -1 ? format.indexOf("MM") : format.indexOf("M");
	const dayIndex = format.indexOf("DD") !== -1 ? format.indexOf("DD") : format.indexOf("D");

	// Create array of indices and sort them
	const indices = [
		{ type: "year", index: yearIndex },
		{ type: "month", index: monthIndex },
		{ type: "day", index: dayIndex }
	].sort((a, b) => a.index - b.index);

	const order: { year: number; month: number; day: number } = { year: -1, month: -1, day: -1 };
	indices.forEach((item, idx) => {
		order[item.type as keyof typeof order] = idx + 1;
	});

	return order;
}

/**
 * Extract date from filename based on format pattern
 * @param filename Filename without extension
 * @param format Format pattern like "YYYY-MM-DD"
 * @returns Date object or null if not found
 */
export function extractDateFromFilename(filename: string, format: string): Date | null {
	const regexPattern = formatToRegex(format);
	const regex = new RegExp(regexPattern);
	const match = filename.match(regex);

	if (!match) return null;

	const order = getDateComponentOrder(format);
	const yearStr = match[order.year];
	const monthStr = match[order.month];
	const dayStr = match[order.day];

	if (!yearStr || !monthStr || !dayStr) return null;

	let year = parseInt(yearStr);
	const month = parseInt(monthStr) - 1; // 0-based month
	const day = parseInt(dayStr);

	// Handle 2-digit year
	if (yearStr.length === 2) {
		const currentYear = new Date().getFullYear();
		const currentCentury = Math.floor(currentYear / 100) * 100;
		year = currentCentury + year;
		// If resulting year is more than 50 years in the future, assume previous century
		if (year > currentYear + 50) {
			year -= 100;
		}
	}

	const date = new Date(year, month, day);
	if (isNaN(date.getTime())) return null;

	return date;
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

		if (date && !isNaN(date.getTime())) {
			const dateStr = formatDateKey(date);
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
				date = new Date(dateValue);
			} else if (dateValue && typeof dateValue === "object") {
				// Handle Obsidian's parsed date object (may have different structure)
				// Try to extract date from various possible formats
				const obj = dateValue as Record<string, unknown>;
				if ("year" in obj && "month" in obj && "day" in obj) {
					date = new Date(obj.year as number, (obj.month as number) - 1, obj.day as number);
				}
			}

			if (date && !isNaN(date.getTime())) {
				const dateStr = formatDateKey(date);
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
