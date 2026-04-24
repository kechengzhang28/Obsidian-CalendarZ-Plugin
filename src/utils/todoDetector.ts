import type { App, TFile } from "obsidian";

/**
 * Todo item status
 */
export interface TodoStatus {
	/** Whether the note has any todo items */
	hasTodos: boolean;
	/** Whether all todo items are completed */
	allCompleted: boolean;
	/** Number of completed todos */
	completedCount: number;
	/** Total number of todos */
	totalCount: number;
}

/**
 * Default empty todo status
 */
export const EMPTY_TODO_STATUS: TodoStatus = {
	hasTodos: false,
	allCompleted: false,
	completedCount: 0,
	totalCount: 0,
};

/**
 * Regex patterns for detecting todo items in markdown
 * Matches:
 * - [ ] or [x] or [X] for checkbox todos
 * - - [ ] or * [ ] or 1. [ ] for list item todos
 */
const TODO_REGEX = /^(?:\s*[-*]\s+|\s*\d+\.\s+|\s*)\[([ xX])\]/gm;

/**
 * Detects todo items in a note's content
 * @param content - The note content to analyze
 * @returns TodoStatus object with detection results
 */
export function detectTodosInContent(content: string): TodoStatus {
	const matches = Array.from(content.matchAll(TODO_REGEX));

	if (matches.length === 0) {
		return EMPTY_TODO_STATUS;
	}

	const totalCount = matches.length;
	const completedCount = matches.filter(match =>
		match[1]?.toLowerCase() === "x"
	).length;

	return {
		hasTodos: true,
		allCompleted: completedCount === totalCount,
		completedCount,
		totalCount,
	};
}

/**
 * Detects todo items in a specific file
 * @param app - Obsidian App instance
 * @param file - The file to analyze
 * @returns TodoStatus object with detection results
 */
export async function detectTodosInFile(
	app: App,
	file: TFile
): Promise<TodoStatus> {
	try {
		const content = await app.vault.read(file);
		return detectTodosInContent(content);
	} catch (error) {
		console.error("Failed to read file for todo detection:", error);
		return EMPTY_TODO_STATUS;
	}
}

/**
 * Todo status cache to avoid repeated file reads
 */
const todoCache = new Map<string, TodoStatus>();

/**
 * Gets todo status for a file with caching
 * @param app - Obsidian App instance
 * @param file - The file to analyze
 * @returns TodoStatus object with detection results
 */
export async function getTodoStatus(
	app: App,
	file: TFile
): Promise<TodoStatus> {
	const cacheKey = `${file.path}-${file.stat.mtime}`;

	if (todoCache.has(cacheKey)) {
		const cached = todoCache.get(cacheKey);
		if (cached) {
			return cached;
		}
	}

	const status = await detectTodosInFile(app, file);
	todoCache.set(cacheKey, status);

	// Limit cache size
	if (todoCache.size > 100) {
		const keysIterator = todoCache.keys();
		const firstKeyResult = keysIterator.next();
		if (!firstKeyResult.done && typeof firstKeyResult.value === "string") {
			todoCache.delete(firstKeyResult.value);
		}
	}

	return status;
}

/**
 * Clears the todo cache
 */
export function clearTodoCache(): void {
	todoCache.clear();
}
