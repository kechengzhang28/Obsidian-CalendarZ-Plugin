/**
 * Month note service
 * Handles month note filename generation, finding, and creation
 */

import { App, Notice, TFile, normalizePath } from "obsidian";
import type { CalendarZSettings } from "../../core/types";
import type { I18nLike } from "../../core/types";
import dayjs from "../../utils/date/dayjsConfig";

/**
 * Parses a month note format string and replaces placeholders with actual values.
 * Supports YYYY (year), MM (month), and [literal] patterns.
 * @param format - Format pattern (e.g., "YYYY-MM")
 * @param year - Full year (e.g., 2024)
 * @param month - Month number (1-12)
 * @returns Formatted filename without extension
 */
function parseMonthNoteFormat(format: string, year: number, month: number): string {
	let result = format;
	result = result.replace(/YYYY/g, year.toString());
	result = result.replace(/MM/g, month.toString().padStart(2, "0"));
	result = result.replace(/\[([^\]]+)\]/g, "$1");
	return result;
}

/**
 * Service for month note operations.
 * Handles month note filename generation, finding, and creation with template support.
 */
export class MonthNoteService {
	/**
	 * Creates a new MonthNoteService instance
	 * @param app - Obsidian app instance
	 */
	constructor(private app: App) {}

	/**
	 * Generates the month note filename for a given date.
	 * @param date - Any date within the target month
	 * @param settings - Plugin settings containing month note format
	 * @returns Filename with .md extension
	 */
	getMonthNoteFilename(date: Date, settings: CalendarZSettings): string {
		const d = dayjs(date);
		const year = d.year();
		const month = d.month() + 1;
		const format = settings.monthNoteFormat || "YYYY-MM";
		const filename = parseMonthNoteFormat(format, year, month);
		return `${filename}.md`;
	}

	/**
	 * Generates the full path for a month note.
	 * Includes the configured folder if set.
	 * @param date - Any date within the target month
	 * @param settings - Plugin settings
	 * @returns Full file path
	 */
	getMonthNotePath(date: Date, settings: CalendarZSettings): string {
		const filename = this.getMonthNoteFilename(date, settings);
		const folder = settings.monthNoteFolder.trim();
		if (folder) {
			return normalizePath(`${folder}/${filename}`);
		}
		return filename;
	}

	/**
	 * Finds an existing month note for the given date.
	 * @param date - Any date within the target month
	 * @param settings - Plugin settings
	 * @returns The month note file, or null if not found
	 */
	findMonthNote(date: Date, settings: CalendarZSettings): TFile | null {
		const path = this.getMonthNotePath(date, settings);
		const file = this.app.vault.getFileByPath(path);
		return file || null;
	}

	/**
	 * Opens an existing month note or creates a new one from template.
	 * @param date - Any date within the target month
	 * @param settings - Plugin settings
	 * @param i18n - i18n object for translated notification messages
	 */
	async openOrCreateMonthNote(date: Date, settings: CalendarZSettings, i18n: I18nLike): Promise<void> {
		const notifications = i18n.notifications as Record<string, string>;
		try {
			if (!settings.monthNoteEnabled) return;

			const existingNote = this.findMonthNote(date, settings);
			if (existingNote) {
				await this.app.workspace.openLinkText(existingNote.path, "", false);
				return;
			}

			await this.ensureMonthNoteFolder(settings);

			const path = this.getMonthNotePath(date, settings);
			const content = await this.createMonthNoteContent(date, settings);
			const file = await this.app.vault.create(path, content);
			await this.app.workspace.openLinkText(file.path, "", false);
		} catch (error) {
			console.error("Failed to create month note:", error);
			new Notice(notifications.monthNoteCreateFailed || "Failed to create month note");
		}
	}

	/**
	 * Creates month note content from a template file.
	 * Replaces placeholders: {{year}}, {{month}}, {{monthName}}, {{date}}
	 * @param date - Any date within the target month
	 * @param settings - Plugin settings
	 * @returns Note content string
	 */
	private async createMonthNoteContent(date: Date, settings: CalendarZSettings): Promise<string> {
		if (!settings.monthNoteTemplate) return "";

		const templateFile = this.app.vault.getFileByPath(settings.monthNoteTemplate);
		if (!templateFile) return "";

		const d = dayjs(date);
		const year = d.year();
		const month = d.month() + 1;
		const monthName = d.format("MMMM");
		const templateContent = await this.app.vault.read(templateFile);

		return templateContent
			.replace(/{{year}}/g, year.toString())
			.replace(/{{month}}/g, month.toString().padStart(2, "0"))
			.replace(/{{monthName}}/g, monthName)
			.replace(/{{date}}/g, d.format("YYYY-MM-DD"));
	}

	/**
	 * Ensures the month note folder exists, creating it if necessary.
	 * @param settings - Plugin settings
	 */
	private async ensureMonthNoteFolder(settings: CalendarZSettings): Promise<void> {
		const folder = settings.monthNoteFolder.trim();
		if (!folder) return;

		const folderPath = normalizePath(folder);
		const existingFolder = this.app.vault.getFolderByPath(folderPath);
		if (!existingFolder) {
			await this.app.vault.createFolder(folderPath);
		}
	}
}
