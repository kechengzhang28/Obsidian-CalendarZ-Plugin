/**
 * Utility functions for the CalendarZ plugin
 *
 * This module provides shared utilities organized by category:
 *
 * - date: Date parsing, formatting, and calculation utilities
 * - path: Path normalization and ignore list checking
 * - GetNotes: Note counting by date extraction (YAML/filename)
 * - createNote: Daily note creation and lookup
 *
 * @example
 * ```typescript
 * import { formatDate, isSameDay, isPathIgnored } from "./utils";
 * import { getNotesCountByYamlDate, openOrCreateDailyNote } from "./utils";
 * ```
 */

export * from "./date";
export * from "./path";
export * from "./getNotes";
export * from "./createNote";
