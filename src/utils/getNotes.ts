import {App, TFile, MetadataCache} from "obsidian";
import type {DateCount} from "../components/types";
import {formatDate, parseDateFromFilename, parseYamlDate} from "./date";
import {isPathIgnored} from "./path";

/**
 * Extracts date from file metadata cache (avoids disk I/O)
 * @param file - Markdown file
 * @param metadataCache - Obsidian metadata cache
 * @param dateFieldName - Name of the date field in frontmatter
 * @returns Date or null
 */
function extractDateFromMetadataCache(
	file: TFile,
	metadataCache: MetadataCache,
	dateFieldName: string
): Date | null {
	const cache = metadataCache.getFileCache(file);
	if (!cache?.frontmatter) return null;

	const dateValue = cache.frontmatter[dateFieldName] as unknown;
	if (!dateValue) return null;

	return parseYamlDate(dateValue);
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
 * Counts notes by date extracted from YAML frontmatter using metadata cache
 * @param app - Obsidian app instance
 * @param ignoredFolders - List of folder paths to ignore
 * @param dateFieldName - Name of the date field in frontmatter
 * @returns Array of date counts
 */
export function getNotesCountByYamlDate(
	app: App,
	ignoredFolders: string[],
	dateFieldName: string
): DateCount[] {
	const files = app.vault.getMarkdownFiles();
	const counts = new Map<string, number>();

	for (const file of files) {
		if (isPathIgnored(file.path, ignoredFolders)) {
			continue;
		}

		const date = extractDateFromMetadataCache(file, app.metadataCache, dateFieldName);
		if (!date) continue;

		const dateStr = formatDate(date);
		counts.set(dateStr, (counts.get(dateStr) || 0) + 1);
	}

	return Array.from(counts.entries()).map(([date, count]) => ({ date, count }));
}

/**
 * Counts notes by date from both YAML frontmatter and filenames
 * @param app - Obsidian app instance
 * @param ignoredFolders - List of folder paths to ignore
 * @param dateFieldName - Name of the date field in frontmatter
 * @param filenameDateFormat - Date format pattern in filenames
 * @returns Array of date counts
 */
export function getNotesCountByBoth(
	app: App,
	ignoredFolders: string[],
	dateFieldName: string,
	filenameDateFormat: string
): DateCount[] {
	const yamlCounts = getNotesCountByYamlDate(app, ignoredFolders, dateFieldName);
	const filenameCounts = getNotesCountByFilenameDate(app, ignoredFolders, filenameDateFormat);

	const mergedCounts = new Map<string, number>();

	for (const { date, count } of yamlCounts) {
		mergedCounts.set(date, (mergedCounts.get(date) || 0) + count);
	}

	for (const { date, count } of filenameCounts) {
		mergedCounts.set(date, (mergedCounts.get(date) || 0) + count);
	}

	return Array.from(mergedCounts.entries()).map(([date, count]) => ({ date, count }));
}
