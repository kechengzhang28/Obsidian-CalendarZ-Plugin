/**
 * Path utility functions for the CalendarZ plugin
 */

/**
 * Normalizes a path by converting backslashes to forward slashes
 * and removing trailing slashes.
 * @param path - Path to normalize
 * @returns Normalized path
 */
export function normalizePath(path: string): string {
	return path.replace(/\\/g, "/").replace(/\/$/, "");
}

/**
 * Checks if a file path should be ignored based on the ignore list.
 * Both the path and ignore patterns are normalized before comparison.
 * @param filePath - Path to check
 * @param ignoredFolders - List of folder paths to ignore
 * @returns True if the path should be ignored
 */
export function isPathIgnored(filePath: string, ignoredFolders: string[]): boolean {
	const normalizedPath = normalizePath(filePath);
	return ignoredFolders.some(folder => {
		const normalizedFolder = normalizePath(folder);
		return normalizedPath === normalizedFolder || normalizedPath.startsWith(normalizedFolder + "/");
	});
}
