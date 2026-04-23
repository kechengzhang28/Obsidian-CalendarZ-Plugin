import {App, Notice, TFile, moment} from "obsidian";
import {
	createDailyNote as createDailyNoteInterface,
	appHasDailyNotesPluginLoaded,
	getDailyNote,
	getAllDailyNotes,
} from "obsidian-daily-notes-interface";
import type {I18n} from "../i18n";

/**
 * Finds an existing daily note for the given date using the core Daily Notes plugin.
 * This strictly follows the Daily Notes plugin's matching method based on filename format.
 * @param date - The date for which to find the daily note
 * @returns The existing TFile if found, null otherwise
 */
export function findDailyNote(date: Date): TFile | null {
	// Check if daily notes plugin is enabled
	if (!appHasDailyNotesPluginLoaded()) {
		return null;
	}

	// Use obsidian-daily-notes-interface to find the daily note
	// This follows the core plugin's matching method (filename format only)
	const allDailyNotes = getAllDailyNotes();
	const existingNote = getDailyNote(moment(date), allDailyNotes);

	// The interface returns a compatible type at runtime
	// eslint-disable-next-line obsidianmd/no-tfile-tfolder-cast
	return existingNote ? (existingNote as TFile) : null;
}

/**
 * Opens an existing daily note or creates a new one for the given date.
 * Uses the core Daily Notes plugin for creation.
 * 
 * @param app - Obsidian App instance
 * @param i18n - Internationalization strings for notifications
 * @param date - The date for which to open/create the daily note
 * @returns Promise that resolves when the note is opened/created
 */
export async function openOrCreateDailyNote(
	app: App,
	i18n: I18n,
	date: Date
): Promise<void> {
	const t = i18n;

	try {
		// Check if daily notes plugin is enabled
		if (!appHasDailyNotesPluginLoaded()) {
			new Notice(t.notifications.dailyNotesNotEnabled);
			return;
		}

		// Get all daily notes and find the note for the specific date
		const existingNote = findDailyNote(date);

		// If note exists, open it
		if (existingNote) {
			await app.workspace.openLinkText(existingNote.path, "", false);
			return;
		}

		// If note doesn't exist, create it using obsidian-daily-notes-interface
		// This automatically handles folder, format, and template settings
		const file = await createDailyNoteInterface(moment(date));
		if (file) {
			await app.workspace.openLinkText(file.path, "", false);
		}
	} catch (error) {
		console.error("Failed to create daily note:", error);
		new Notice(t.notifications.dailyNotesCreateFailed);
	}
}

/**
 * @deprecated Use openOrCreateDailyNote instead
 * Creates or opens a daily note for the given date using the core Daily Notes plugin.
 * If the note already exists, it will be opened. Otherwise, a new note will be created.
 * @param app - Obsidian App instance
 * @param i18n - Internationalization strings
 * @param date - The date for which to create/open the daily note
 * @returns Promise that resolves when the note is created/opened
 */
export async function createDailyNote(
	app: App,
	i18n: I18n,
	date: Date
): Promise<void> {
	return openOrCreateDailyNote(app, i18n, date);
}
