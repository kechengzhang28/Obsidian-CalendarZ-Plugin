import {Notice} from "obsidian";
import {
	createDailyNote as createDailyNoteInterface,
	appHasDailyNotesPluginLoaded,
	getDailyNote,
	getAllDailyNotes,
} from "obsidian-daily-notes-interface";
import moment from "moment";
import CalendarZ from "../main";

/**
 * Creates or opens a daily note for the given date using the core Daily Notes plugin.
 * If the note already exists, it will be opened. Otherwise, a new note will be created.
 * @param plugin - CalendarZ plugin instance (for accessing i18n)
 * @param date - The date for which to create/open the daily note
 * @returns Promise that resolves when the note is created/opened
 */
export async function createDailyNote(plugin: CalendarZ, date: Date): Promise<void> {
	const t = plugin.i18n;

	try {
		// Check if daily notes plugin is enabled
		if (!appHasDailyNotesPluginLoaded()) {
			new Notice(t.notifications.dailyNotesNotEnabled);
			return;
		}

		// Get all daily notes and find the note for the specific date
		const allDailyNotes = getAllDailyNotes();
		const existingNote = getDailyNote(moment(date), allDailyNotes);

		// If note exists, open it
		if (existingNote) {
			await plugin.app.workspace.openLinkText(existingNote.path, "", false);
			return;
		}

		// If note doesn't exist, create it using obsidian-daily-notes-interface
		// This automatically handles folder, format, and template settings
		const file = await createDailyNoteInterface(moment(date));
		if (file) {
			await plugin.app.workspace.openLinkText(file.path, "", false);
		}
	} catch (error) {
		console.error("Failed to create daily note:", error);
		new Notice(t.notifications.dailyNotesCreateFailed);
	}
}
