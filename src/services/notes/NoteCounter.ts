/**
 * Note counting service
 * Handles counting notes by date from various sources (YAML, filename, both)
 */

import { App, TFile, MetadataCache } from "obsidian";
import type { DateCount } from "../../components/types";
import { formatDate, parseDateFromFilename, parseYamlDate } from "../../utils/date";
import { isPathIgnored } from "../../utils/path";
import type { CalendarZSettings } from "../../core/types";
import { DATE_SOURCE, STATISTICS_TYPE } from "../../core/constants";

/**
 * Extracts date from file metadata cache (avoids disk I/O)
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
 * Counts words in a string (excluding markdown syntax)
 */
function countWords(content: string): number {
	const withoutFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n?/, "");
	const withoutMarkdown = withoutFrontmatter
		.replace(/!\[.*?\]\(.*?\)/g, "")
		.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
		.replace(/[#*_~`>|-]/g, "")
		.replace(/\[\^.*?\]/g, "")
		.replace(/\n+/g, " ");
	const chineseChars = (withoutMarkdown.match(/[\u4e00-\u9fa5]/g) || []).length;
	const englishWords = (withoutMarkdown.match(/[a-zA-Z]+/g) || []).length;
	return chineseChars + englishWords;
}

/**
 * Generic function to count items by date
 */
function countByDate<T>(
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

export class NoteCounter {
	constructor(private app: App) {}

	/**
	 * Gets note counts based on current settings
	 */
	async getCounts(settings: CalendarZSettings): Promise<DateCount[]> {
		if (settings.displayMode === "none") return [];

		const isWordCount = settings.statisticsType === STATISTICS_TYPE.WORD_COUNT;

		if (settings.dateSource === DATE_SOURCE.FILENAME) {
			return isWordCount
				? await this.getWordCountByFilenameDate(settings)
				: this.getNotesCountByFilenameDate(settings);
		}
		if (settings.dateSource === DATE_SOURCE.BOTH) {
			return isWordCount
				? await this.getWordCountByBoth(settings)
				: this.getNotesCountByBoth(settings);
		}
		return isWordCount
			? await this.getWordCountByYamlDate(settings)
			: this.getNotesCountByYamlDate(settings);
	}

	getNotesCountByFilenameDate(settings: CalendarZSettings): DateCount[] {
		return countByDate(
			this.app.vault.getFiles(),
			file => isPathIgnored(file.path, settings.ignoredFolders),
			file => parseDateFromFilename(file.name.replace(/\.[^/.]+$/, ""), settings.filenameDateFormat)
		);
	}

	getNotesCountByYamlDate(settings: CalendarZSettings): DateCount[] {
		const files = this.app.vault.getMarkdownFiles();
		const counts = new Map<string, number>();

		for (const file of files) {
			if (isPathIgnored(file.path, settings.ignoredFolders)) continue;
			const date = extractDateFromMetadataCache(file, this.app.metadataCache, settings.dateFieldName);
			if (!date) continue;
			const dateStr = formatDate(date);
			counts.set(dateStr, (counts.get(dateStr) || 0) + 1);
		}

		return Array.from(counts.entries()).map(([date, count]) => ({ date, count }));
	}

	getNotesCountByBoth(settings: CalendarZSettings): DateCount[] {
		const yamlCounts = this.getNotesCountByYamlDate(settings);
		const filenameCounts = this.getNotesCountByFilenameDate(settings);
		return this.mergeCounts(yamlCounts, filenameCounts);
	}

	async getWordCountByYamlDate(settings: CalendarZSettings): Promise<DateCount[]> {
		const files = this.app.vault.getMarkdownFiles();
		const counts = new Map<string, number>();

		for (const file of files) {
			if (isPathIgnored(file.path, settings.ignoredFolders)) continue;
			const date = extractDateFromMetadataCache(file, this.app.metadataCache, settings.dateFieldName);
			if (!date) continue;
			const content = await this.app.vault.cachedRead(file);
			const wordCount = countWords(content);
			const dateStr = formatDate(date);
			counts.set(dateStr, (counts.get(dateStr) || 0) + wordCount);
		}

		return Array.from(counts.entries()).map(([date, count]) => ({ date, count }));
	}

	async getWordCountByFilenameDate(settings: CalendarZSettings): Promise<DateCount[]> {
		const files = this.app.vault.getFiles();
		const counts = new Map<string, number>();

		for (const file of files) {
			if (isPathIgnored(file.path, settings.ignoredFolders)) continue;
			const date = parseDateFromFilename(file.name.replace(/\.[^/.]+$/, ""), settings.filenameDateFormat);
			if (!date) continue;
			const content = await this.app.vault.cachedRead(file);
			const wordCount = countWords(content);
			const dateStr = formatDate(date);
			counts.set(dateStr, (counts.get(dateStr) || 0) + wordCount);
		}

		return Array.from(counts.entries()).map(([date, count]) => ({ date, count }));
	}

	async getWordCountByBoth(settings: CalendarZSettings): Promise<DateCount[]> {
		const yamlCounts = await this.getWordCountByYamlDate(settings);
		const filenameCounts = await this.getWordCountByFilenameDate(settings);
		return this.mergeCounts(yamlCounts, filenameCounts);
	}

	private mergeCounts(a: DateCount[], b: DateCount[]): DateCount[] {
		const merged = new Map<string, number>();
		for (const { date, count } of a) merged.set(date, (merged.get(date) || 0) + count);
		for (const { date, count } of b) merged.set(date, (merged.get(date) || 0) + count);
		return Array.from(merged.entries()).map(([date, count]) => ({ date, count }));
	}
}
