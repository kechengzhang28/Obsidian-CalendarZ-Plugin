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
import type { CalendarZSettings } from "../../core/types";
import type { I18n } from "../../i18n";
import { formatDate } from "../../utils/date/formatter";

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
	 * @param settings - Plugin settings (used for date frontmatter field name)
	 * @param i18n - i18n object for translated notification messages
	 */
	async openOrCreateDailyNote(
		date: Date,
		settings: CalendarZSettings,
		i18n: I18n
	): Promise<void> {
		const notifications = i18n.notifications;
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
				await this.setDateFrontmatter(file, date, settings.dateFieldName);
				await this.app.workspace.openLinkText(file.path, "", false);
			}
		} catch (error) {
			console.error("Failed to create daily note:", error);
			new Notice(notifications.dailyNotesCreateFailed ?? "Failed to create daily note");
		}
	}

	/**
	 * Sets the configured date field in frontmatter to the target day (YYYY-MM-DD).
	 * @param file - Note file to update
	 * @param date - Target date
	 * @param dateFieldName - YAML frontmatter field name from settings
	 */
	private async setDateFrontmatter(
		file: TFile,
		date: Date,
		dateFieldName: string
	): Promise<void> {
		const field = dateFieldName.trim();
		if (!field) return;

		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			frontmatter[field] = formatDate(date);
		});
	}
}
