/**
 * Path utility functions for the CalendarZ plugin
 */

import { normalizePath as obsidianNormalizePath } from "obsidian";

/**
 * Checks if a file path should be ignored based on the ignore list.
 * Both the path and ignore patterns are normalized before comparison.
 * @param filePath - Path to check
 * @param ignoredFolders - List of folder paths to ignore
 * @returns True if the path should be ignored
 */
export function isPathIgnored(filePath: string, ignoredFolders: string[]): boolean {
	const normalizedPath = obsidianNormalizePath(filePath);
	return ignoredFolders.some(folder => {
		const normalizedFolder = obsidianNormalizePath(folder);
		return normalizedPath === normalizedFolder || normalizedPath.startsWith(normalizedFolder + "/");
	});
}
