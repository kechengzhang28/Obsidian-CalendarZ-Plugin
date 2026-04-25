/**
 * Daily note service
 * Handles finding and creating daily notes using the core Daily Notes plugin
 */

import { App, Notice, TFile, moment } from "obsidian";
import {
	createDailyNote as createDailyNoteInterface,
	appHasDailyNotesPluginLoaded,
	getDailyNote,
	getAllDailyNotes,
} from "obsidian-daily-notes-interface";
import type { I18nLike } from "../../core/types";

/**
 * Service for daily note operations.
 * Integrates with the core Daily Notes plugin to find and create daily notes.
 */
export class DailyNoteService {
	/**
	 * Creates a new DailyNoteService instance
	 * @param app - Obsidian app instance
	 */
	constructor(private app: App) {}

	/**
	 * Finds an existing daily note for the given date.
	 * Uses the core Daily Notes plugin's API to locate the note.
	 * @param date - Target date
	 * @returns The daily note file, or null if not found
	 */
	findDailyNote(date: Date): TFile | null {
		if (!appHasDailyNotesPluginLoaded()) return null;

		const allDailyNotes = getAllDailyNotes();
		const existingNote = getDailyNote(moment(date), allDailyNotes);
		if (!existingNote) return null;

		const file = this.app.vault.getFileByPath(existingNote.path);
		return file;
	}

	/**
	 * Opens an existing daily note or creates a new one.
	 * Shows notifications on errors.
	 * @param date - Target date
	 * @param i18n - i18n object for translated notification messages
	 */
	async openOrCreateDailyNote(date: Date, i18n: I18nLike): Promise<void> {
		const notifications = i18n.notifications as Record<string, string>;
		try {
			if (!appHasDailyNotesPluginLoaded()) {
				new Notice(notifications.dailyNotesNotEnabled ?? "Daily notes plugin not enabled");
				return;
			}

			const existingNote = this.findDailyNote(date);
			if (existingNote) {
				await this.app.workspace.openLinkText(existingNote.path, "", false);
				return;
			}

			const file = await createDailyNoteInterface(moment(date));
			if (file) {
				await this.app.workspace.openLinkText(file.path, "", false);
			}
		} catch (error) {
			console.error("Failed to create daily note:", error);
			new Notice(notifications.dailyNotesCreateFailed ?? "Failed to create daily note");
		}
	}
}
