/**
 * Week note service
 * Handles week note filename generation, finding, and creation
 */

import { App, Notice, TFile, normalizePath } from "obsidian";
import type { CalendarZSettings, WeekStart } from "../../core/types";
import type { I18nLike } from "../../core/types";
import dayjs, { setWeekStart } from "../../utils/date/dayjsConfig";

/**
 * Parses a week note format string and replaces placeholders with actual values.
 * Supports YYYY (year), WW (week number), and [literal] patterns.
 * @param format - Format pattern (e.g., "YYYY-[W]WW")
 * @param year - Full year (e.g., 2024)
 * @param week - Week number (1-53)
 * @returns Formatted filename without extension
 */
function parseWeekNoteFormat(format: string, year: number, week: number): string {
	let result = format;
	result = result.replace(/YYYY/g, year.toString());
	result = result.replace(/WW/g, week.toString().padStart(2, "0"));
	result = result.replace(/\[([^\]]+)\]/g, "$1");
	return result;
}

/**
 * Service for week note operations.
 * Handles week note filename generation, finding, and creation with template support.
 */
export class WeekNoteService {
	/**
	 * Creates a new WeekNoteService instance
	 * @param app - Obsidian app instance
	 */
	constructor(private app: App) {}

	/**
	 * Generates the week note filename for a given date.
	 * @param date - Any date within the target week
	 * @param settings - Plugin settings containing week note format
	 * @returns Filename with .md extension
	 */
	getWeekNoteFilename(date: Date, settings: CalendarZSettings): string {
		setWeekStart(settings.weekStart);
		const d = dayjs(date);
		const year = d.year();
		const week = d.week();
		const format = settings.weekNoteFormat || "YYYY-[W]WW";
		const filename = parseWeekNoteFormat(format, year, week);
		return `${filename}.md`;
	}

	/**
	 * Generates the full path for a week note.
	 * Includes the configured folder if set.
	 * @param date - Any date within the target week
	 * @param settings - Plugin settings
	 * @returns Full file path
	 */
	getWeekNotePath(date: Date, settings: CalendarZSettings): string {
		const filename = this.getWeekNoteFilename(date, settings);
		const folder = settings.weekNoteFolder.trim();
		if (folder) {
			return normalizePath(`${folder}/${filename}`);
		}
		return filename;
	}

	/**
	 * Finds an existing week note for the given date.
	 * @param date - Any date within the target week
	 * @param settings - Plugin settings
	 * @returns The week note file, or null if not found
	 */
	findWeekNote(date: Date, settings: CalendarZSettings): TFile | null {
		const path = this.getWeekNotePath(date, settings);
		const file = this.app.vault.getFileByPath(path);
		return file || null;
	}

	/**
	 * Gets a human-readable date range for a week.
	 * @param date - Any date within the target week
	 * @param weekStart - Week start preference ("sunday" or "monday")
	 * @returns Formatted date range string (e.g., "Jan 01 - Jan 07")
	 */
	getWeekDateRange(date: Date, weekStart: WeekStart): string {
		setWeekStart(weekStart);
		const d = dayjs(date);
		const startOfWeek = d.startOf("week");
		const endOfWeek = d.endOf("week");
		return `${startOfWeek.format("MMM DD")} - ${endOfWeek.format("MMM DD")}`;
	}

	/**
	 * Opens an existing week note or creates a new one from template.
	 * @param date - Any date within the target week
	 * @param settings - Plugin settings
	 * @param i18n - i18n object for translated notification messages
	 */
	async openOrCreateWeekNote(date: Date, settings: CalendarZSettings, i18n: I18nLike): Promise<void> {
		const notifications = i18n.notifications as Record<string, string>;
		try {
			if (!settings.weekNoteEnabled) return;

			const existingNote = this.findWeekNote(date, settings);
			if (existingNote) {
				await this.app.workspace.openLinkText(existingNote.path, "", false);
				return;
			}

			await this.ensureWeekNoteFolder(settings);

			const path = this.getWeekNotePath(date, settings);
			const content = await this.createWeekNoteContent(date, settings);
			const file = await this.app.vault.create(path, content);
			await this.app.workspace.openLinkText(file.path, "", false);
		} catch (error) {
			console.error("Failed to create week note:", error);
			new Notice(notifications.weekNoteCreateFailed || "Failed to create week note");
		}
	}

	/**
	 * Creates week note content from a template file.
	 * Replaces placeholders: {{year}}, {{week}}, {{dateRange}}, {{date}}
	 * @param date - Any date within the target week
	 * @param settings - Plugin settings
	 * @returns Note content string
	 */
	private async createWeekNoteContent(date: Date, settings: CalendarZSettings): Promise<string> {
		if (!settings.weekNoteTemplate) return "";

		const templateFile = this.app.vault.getFileByPath(settings.weekNoteTemplate);
		if (!templateFile) return "";

		setWeekStart(settings.weekStart);
		const d = dayjs(date);
		const year = d.year();
		const week = d.week();
		const dateRange = this.getWeekDateRange(date, settings.weekStart);
		const templateContent = await this.app.vault.read(templateFile);

		return templateContent
			.replace(/{{year}}/g, year.toString())
			.replace(/{{week}}/g, week.toString().padStart(2, "0"))
			.replace(/{{dateRange}}/g, dateRange)
			.replace(/{{date}}/g, d.format("YYYY-MM-DD"));
	}

	/**
	 * Ensures the week note folder exists, creating it if necessary.
	 * @param settings - Plugin settings
	 */
	private async ensureWeekNoteFolder(settings: CalendarZSettings): Promise<void> {
		const folder = settings.weekNoteFolder.trim();
		if (!folder) return;

		const folderPath = normalizePath(folder);
		const existingFolder = this.app.vault.getFolderByPath(folderPath);
		if (!existingFolder) {
			await this.app.vault.createFolder(folderPath);
		}
	}
}
