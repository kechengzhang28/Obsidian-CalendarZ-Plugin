/**
 * Year note service
 * Handles year note filename generation, finding, and creation
 */

import { App, Notice, TFile, normalizePath } from "obsidian";
import type { CalendarZSettings } from "../../core/types";
import type { I18nLike } from "../../core/types";
import dayjs from "../../utils/date/dayjsConfig";

/**
 * Parses a year note format string and replaces placeholders with actual values.
 * Supports YYYY (year) and [literal] patterns.
 * @param format - Format pattern (e.g., "YYYY")
 * @param year - Full year (e.g., 2024)
 * @returns Formatted filename without extension
 */
function parseYearNoteFormat(format: string, year: number): string {
	let result = format;
	result = result.replace(/YYYY/g, year.toString());
	result = result.replace(/\[([^\]]+)\]/g, "$1");
	return result;
}

/**
 * Service for year note operations.
 * Handles year note filename generation, finding, and creation with template support.
 */
export class YearNoteService {
	/**
	 * Creates a new YearNoteService instance
	 * @param app - Obsidian app instance
	 */
	constructor(private app: App) {}

	/**
	 * Generates the year note filename for a given date.
	 * @param date - Any date within the target year
	 * @param settings - Plugin settings containing year note format
	 * @returns Filename with .md extension
	 */
	getYearNoteFilename(date: Date, settings: CalendarZSettings): string {
		const d = dayjs(date);
		const year = d.year();
		const format = settings.yearNoteFormat || "YYYY";
		const filename = parseYearNoteFormat(format, year);
		return `${filename}.md`;
	}

	/**
	 * Generates the full path for a year note.
	 * Includes the configured folder if set.
	 * @param date - Any date within the target year
	 * @param settings - Plugin settings
	 * @returns Full file path
	 */
	getYearNotePath(date: Date, settings: CalendarZSettings): string {
		const filename = this.getYearNoteFilename(date, settings);
		const folder = settings.yearNoteFolder.trim();
		if (folder) {
			return normalizePath(`${folder}/${filename}`);
		}
		return filename;
	}

	/**
	 * Finds an existing year note for the given date.
	 * @param date - Any date within the target year
	 * @param settings - Plugin settings
	 * @returns The year note file, or null if not found
	 */
	findYearNote(date: Date, settings: CalendarZSettings): TFile | null {
		const path = this.getYearNotePath(date, settings);
		const file = this.app.vault.getFileByPath(path);
		return file || null;
	}

	/**
	 * Opens an existing year note or creates a new one from template.
	 * @param date - Any date within the target year
	 * @param settings - Plugin settings
	 * @param i18n - i18n object for translated notification messages
	 */
	async openOrCreateYearNote(date: Date, settings: CalendarZSettings, i18n: I18nLike): Promise<void> {
		const notifications = i18n.notifications as Record<string, string>;
		try {
			if (!settings.yearNoteEnabled) return;

			const existingNote = this.findYearNote(date, settings);
			if (existingNote) {
				await this.app.workspace.openLinkText(existingNote.path, "", false);
				return;
			}

			await this.ensureYearNoteFolder(settings);

			const path = this.getYearNotePath(date, settings);
			const content = await this.createYearNoteContent(date, settings);
			const file = await this.app.vault.create(path, content);
			await this.app.workspace.openLinkText(file.path, "", false);
		} catch (error) {
			console.error("Failed to create year note:", error);
			new Notice(notifications.yearNoteCreateFailed || "Failed to create year note");
		}
	}

	/**
	 * Creates year note content from a template file.
	 * Replaces placeholders: {{year}}, {{date}}
	 * @param date - Any date within the target year
	 * @param settings - Plugin settings
	 * @returns Note content string
	 */
	private async createYearNoteContent(date: Date, settings: CalendarZSettings): Promise<string> {
		if (!settings.yearNoteTemplate) return "";

		const templateFile = this.app.vault.getFileByPath(settings.yearNoteTemplate);
		if (!templateFile) return "";

		const d = dayjs(date);
		const year = d.year();
		const templateContent = await this.app.vault.read(templateFile);

		return templateContent
			.replace(/{{year}}/g, year.toString())
			.replace(/{{date}}/g, d.format("YYYY-MM-DD"));
	}

	/**
	 * Ensures the year note folder exists, creating it if necessary.
	 * @param settings - Plugin settings
	 */
	private async ensureYearNoteFolder(settings: CalendarZSettings): Promise<void> {
		const folder = settings.yearNoteFolder.trim();
		if (!folder) return;

		const folderPath = normalizePath(folder);
		const existingFolder = this.app.vault.getFolderByPath(folderPath);
		if (!existingFolder) {
			await this.app.vault.createFolder(folderPath);
		}
	}
}
