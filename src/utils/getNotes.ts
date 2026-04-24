import {App, parseYaml, TFile} from "obsidian";
import type {DateCount} from "../components/types";
import {formatDate, parseDateFromFilename, parseYamlDate} from "./date";
import {isPathIgnored} from "./path";

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
			const dateStr = formatDate(date);
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
		file => parseDateFromFilename(file.name.replace(/\.[^/.]+$/, ""), filenameDateFormat)
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

		return formatDate(date);
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
