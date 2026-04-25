/**
 * Todo detection service
 * Handles todo status detection for daily notes and week notes
 */

import type { App, TFile } from "obsidian";
import { normalizePath } from "obsidian";
import type { DateTodoStatus, WeekTodoStatus } from "../../components/types";

import { isPathIgnored } from "../../utils/path";
import type { CalendarZSettings } from "../../core/types";
import { DATE_SOURCE } from "../../core/constants";
import dayjs from "../../utils/date/dayjsConfig";

export interface TodoStatus {
	hasTodos: boolean;
	allCompleted: boolean;
	completedCount: number;
	totalCount: number;
}

const EMPTY_TODO_STATUS: TodoStatus = {
	hasTodos: false,
	allCompleted: false,
	completedCount: 0,
	totalCount: 0,
};

const TODO_REGEX = /^(?:\s*[-*]\s+|\s*\d+\.\s+|\s*)\[([ xX])\]/gm;

/** Cache entry with mtime for invalidation */
interface CacheEntry {
	mtime: number;
	status: TodoStatus;
}

function detectTodosInContent(content: string): TodoStatus {
	const matches = Array.from(content.matchAll(TODO_REGEX));
	if (matches.length === 0) return EMPTY_TODO_STATUS;

	const totalCount = matches.length;
	const completedCount = matches.filter(m => m[1]?.toLowerCase() === "x").length;

	return {
		hasTodos: true,
		allCompleted: completedCount === totalCount,
		completedCount,
		totalCount,
	};
}

async function detectTodosInFile(app: App, file: TFile): Promise<TodoStatus> {
	try {
		const content = await app.vault.cachedRead(file);
		return detectTodosInContent(content);
	} catch (error) {
		console.error("Failed to read file for todo detection:", error);
		return EMPTY_TODO_STATUS;
	}
}

export class TodoService {
	private cache = new Map<string, CacheEntry>();
	private readonly MAX_CACHE_SIZE = 100;
	/** Cache for compiled week note regex patterns */
	private weekNoteRegexCache = new Map<string, RegExp>();
	/** Maximum number of files to process concurrently */
	private readonly CONCURRENT_BATCH_SIZE = 10;

	constructor(private app: App) {}

	/**
	 * Gets todo status for a file with caching.
	 * Uses file path as key and mtime for cache invalidation.
	 */
	async getTodoStatus(file: TFile): Promise<TodoStatus> {
		const cached = this.cache.get(file.path);

		// Return cached status if mtime matches (file hasn't changed)
		if (cached && cached.mtime === file.stat.mtime) {
			return cached.status;
		}

		// Fetch new status and update cache
		const status = await detectTodosInFile(this.app, file);
		this.cache.set(file.path, { mtime: file.stat.mtime, status });

		// Enforce cache size limit
		this.enforceCacheSizeLimit();

		return status;
	}

	/**
	 * Enforces cache size limit to prevent memory leaks.
	 * Removes oldest entries when cache exceeds MAX_CACHE_SIZE.
	 */
	private enforceCacheSizeLimit(): void {
		if (this.cache.size > this.MAX_CACHE_SIZE) {
			const first = this.cache.keys().next();
			if (!first.done && typeof first.value === "string") {
				this.cache.delete(first.value);
			}
		}
	}

	clearCache(): void {
		this.cache.clear();
	}

	/**
	 * Clears cache entry for a specific file
	 */
	clearFileCache(filePath: string): void {
		this.cache.delete(filePath);
	}

	/**
	 * Process items in batches to limit concurrent operations.
	 * Prevents I/O blocking when processing large numbers of files.
	 */
	private async batchProcess<T, R>(
		items: T[],
		processor: (item: T) => Promise<R>,
		batchSize: number = this.CONCURRENT_BATCH_SIZE
	): Promise<R[]> {
		const results: R[] = [];
		for (let i = 0; i < items.length; i += batchSize) {
			const batch = items.slice(i, i + batchSize);
			const batchResults = await Promise.all(batch.map(processor));
			results.push(...batchResults);
		}
		return results;
	}

	/**
	 * Fetches todo statuses for all daily notes
	 */
	async fetchDailyTodoStatuses(settings: CalendarZSettings): Promise<DateTodoStatus[]> {
		const files = this.app.vault.getMarkdownFiles();

		// Pre-filter files to reduce processing overhead
		const candidateFiles = files.filter(file => {
			if (isPathIgnored(file.path, settings.ignoredFolders)) return false;
			return this.extractDateFromFile(file, settings) !== null;
		});

		// Process files in batches to limit concurrent I/O
		const results = await this.batchProcess(
			candidateFiles,
			async (file) => {
				const dateStr = this.extractDateFromFile(file, settings)!;
				const todoStatus = await this.getTodoStatus(file);
				return todoStatus.hasTodos ? {
					date: dateStr,
					hasTodos: true,
					allCompleted: todoStatus.allCompleted,
				} : null;
			}
		);

		return results.filter((item): item is DateTodoStatus => item !== null);
	}

	/**
	 * Fetches todo statuses for all week notes
	 */
	async fetchWeekTodoStatuses(settings: CalendarZSettings): Promise<WeekTodoStatus[]> {
		const files = this.app.vault.getMarkdownFiles();

		// Pre-filter files to reduce processing overhead
		const candidateFiles = files.filter(file => {
			if (isPathIgnored(file.path, settings.ignoredFolders)) return false;
			return this.extractWeekKeyFromPath(file.path, settings) !== null;
		});

		// Process files in batches to limit concurrent I/O
		const results = await this.batchProcess(
			candidateFiles,
			async (file) => {
				const todoStatus = await this.getTodoStatus(file);
				if (!todoStatus.hasTodos) return null;

				const weekKey = this.extractWeekKeyFromPath(file.path, settings);
				return weekKey ? {
					weekKey,
					hasTodos: true,
					allCompleted: todoStatus.allCompleted,
				} : null;
			}
		);

		return results.filter((item): item is WeekTodoStatus => item !== null);
	}

	/**
	 * Extracts date string from file based on settings
	 */
	private extractDateFromFile(file: TFile, settings: CalendarZSettings): string | null {
		if (settings.dateSource === DATE_SOURCE.YAML || settings.dateSource === DATE_SOURCE.BOTH) {
			const cache = this.app.metadataCache.getFileCache(file);
			const frontmatter = cache?.frontmatter;
			if (frontmatter) {
				const dateValue: unknown = frontmatter[settings.dateFieldName];
				if (typeof dateValue === "string") {
					const parsed = dayjs(dateValue);
					if (parsed.isValid()) return parsed.format("YYYY-MM-DD");
				}
			}
		}

		if (settings.dateSource === DATE_SOURCE.FILENAME || settings.dateSource === DATE_SOURCE.BOTH) {
			const dateMatch = file.basename.match(/(\d{4})[-_]?(\d{2})[-_]?(\d{2})/);
			if (dateMatch) {
				const [, year, month, day] = dateMatch;
				const parsed = dayjs(`${year}-${month}-${day}`);
				if (parsed.isValid()) return parsed.format("YYYY-MM-DD");
			}
		}

		return null;
	}

	/**
	 * Gets or creates a cached regex for week note format.
	 * Avoids recompiling the same regex pattern repeatedly.
	 */
	private getWeekNoteRegex(format: string): RegExp {
		const cached = this.weekNoteRegexCache.get(format);
		if (cached) return cached;

		const regexPattern = format
			.replace(/\[/g, "\\[")
			.replace(/\]/g, "\\]")
			.replace(/YYYY/g, "(\\d{4})")
			.replace(/WW/g, "(\\d{2})")
			.replace(/\\\[([^\\\]]+)\\\]/g, "$1");

		const regex = new RegExp(`^${regexPattern}$`);
		this.weekNoteRegexCache.set(format, regex);
		return regex;
	}

	/**
	 * Extracts week key from file path if it's a week note
	 */
	private extractWeekKeyFromPath(filePath: string, settings: CalendarZSettings): string | null {
		const folder = normalizePath(settings.weekNoteFolder.trim());
		const format = settings.weekNoteFormat || "YYYY-[W]WW";

		const normalizedFilePath = normalizePath(filePath);
		let filename = normalizedFilePath;
		if (folder && normalizedFilePath.startsWith(folder + "/")) {
			filename = normalizedFilePath.slice(folder.length + 1);
		}
		if (filename.endsWith(".md")) {
			filename = filename.slice(0, -3);
		}

		// Use cached regex to avoid recompiling
		const regex = this.getWeekNoteRegex(format);
		const match = filename.match(regex);
		if (!match) return null;

		const yearIndex = format.indexOf("YYYY");
		const weekIndex = format.indexOf("WW");
		if (yearIndex === -1 || weekIndex === -1) return null;

		let yearGroup = 1;
		let weekGroup = 1;
		if (yearIndex < weekIndex) weekGroup = 2;
		else yearGroup = 2;

		const year = match[yearGroup];
		const week = match[weekGroup];
		if (!year || !week) return null;

		return `${year}-W${week}`;
	}
}
