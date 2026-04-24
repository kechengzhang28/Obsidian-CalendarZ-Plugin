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
 * @param app - Obsidian App instance
 * @param date - The date for which to find the daily note
 * @returns The existing TFile if found, null otherwise
 */
export function findDailyNote(app: App, date: Date): TFile | null {
	// Check if daily notes plugin is enabled
	if (!appHasDailyNotesPluginLoaded()) {
		return null;
	}

	// Use obsidian-daily-notes-interface to find the daily note
	// This follows the core plugin's matching method (filename format only)
	const allDailyNotes = getAllDailyNotes();
	const existingNote = getDailyNote(moment(date), allDailyNotes);

	// Return null if no note found
	// Note: existingNote is compatible with TFile at runtime despite type differences
	// between obsidian package versions
	if (!existingNote) {
		return null;
	}

	// Use vault.getFileByPath to get the TFile from the vault
	// This avoids direct type casting between incompatible TFile types from different packages
	const filePath = existingNote.path;
	const file = app.vault.getFileByPath(filePath);
	return file;
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
		const existingNote = findDailyNote(app, date);

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


