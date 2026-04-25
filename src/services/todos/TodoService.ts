/**
 * Todo detection service
 * Handles todo status detection for daily notes and week notes
 */

import type { App, TFile } from "obsidian";
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
		const content = await app.vault.read(file);
		return detectTodosInContent(content);
	} catch (error) {
		console.error("Failed to read file for todo detection:", error);
		return EMPTY_TODO_STATUS;
	}
}

export class TodoService {
	private cache = new Map<string, TodoStatus>();

	constructor(private app: App) {}

	/**
	 * Gets todo status for a file with caching
	 */
	async getTodoStatus(file: TFile): Promise<TodoStatus> {
		const cacheKey = `${file.path}-${file.stat.mtime}`;
		if (this.cache.has(cacheKey)) {
			const cached = this.cache.get(cacheKey);
			if (cached) return cached;
		}

		const status = await detectTodosInFile(this.app, file);
		this.cache.set(cacheKey, status);

		if (this.cache.size > 100) {
			const first = this.cache.keys().next();
			if (!first.done && typeof first.value === "string") {
				this.cache.delete(first.value);
			}
		}

		return status;
	}

	clearCache(): void {
		this.cache.clear();
	}

	/**
	 * Clears cache entries for a specific file
	 */
	clearFileCache(filePath: string): void {
		for (const key of this.cache.keys()) {
			if (key.startsWith(filePath)) {
				this.cache.delete(key);
			}
		}
	}

	/**
	 * Fetches todo statuses for all daily notes
	 */
	async fetchDailyTodoStatuses(settings: CalendarZSettings): Promise<DateTodoStatus[]> {
		const statuses: DateTodoStatus[] = [];
		const files = this.app.vault.getMarkdownFiles();

		for (const file of files) {
			if (isPathIgnored(file.path, settings.ignoredFolders)) continue;

			const dateStr = this.extractDateFromFile(file, settings);
			if (!dateStr) continue;

			const todoStatus = await this.getTodoStatus(file);
			if (todoStatus.hasTodos) {
				statuses.push({
					date: dateStr,
					hasTodos: true,
					allCompleted: todoStatus.allCompleted,
				});
			}
		}

		return statuses;
	}

	/**
	 * Fetches todo statuses for all week notes
	 */
	async fetchWeekTodoStatuses(settings: CalendarZSettings): Promise<WeekTodoStatus[]> {
		const statuses: WeekTodoStatus[] = [];
		const files = this.app.vault.getMarkdownFiles();

		for (const file of files) {
			if (isPathIgnored(file.path, settings.ignoredFolders)) continue;

			const todoStatus = await this.getTodoStatus(file);
			if (!todoStatus.hasTodos) continue;

			const weekKey = this.extractWeekKeyFromPath(file.path, settings);
			if (weekKey) {
				statuses.push({
					weekKey,
					hasTodos: true,
					allCompleted: todoStatus.allCompleted,
				});
			}
		}

		return statuses;
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
	 * Extracts week key from file path if it's a week note
	 */
	private extractWeekKeyFromPath(filePath: string, settings: CalendarZSettings): string | null {
		const folder = settings.weekNoteFolder.trim();
		const format = settings.weekNoteFormat || "YYYY-[W]WW";

		let filename = filePath;
		if (folder && filePath.startsWith(folder + "/")) {
			filename = filePath.slice(folder.length + 1);
		}
		if (filename.endsWith(".md")) {
			filename = filename.slice(0, -3);
		}

		const regexPattern = format
			.replace(/\[/g, "\\[")
			.replace(/\]/g, "\\]")
			.replace(/YYYY/g, "(\\d{4})")
			.replace(/WW/g, "(\\d{2})")
			.replace(/\\\[([^\\\]]+)\\\]/g, "$1");

		const regex = new RegExp(`^${regexPattern}$`);
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
