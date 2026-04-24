import { App, Notice, TFile, normalizePath } from "obsidian";
import type { I18n } from "../i18n";
import type { CalendarZSettings, WeekStart } from "../settings/types";
import dayjs from "./date/dayjsConfig";

/**
 * Generates the week note filename based on the date and settings
 * @param date - The date within the week
 * @param weekStart - Week start preference
 * @returns Formatted filename (e.g., "2024-W01.md")
 */
export function getWeekNoteFilename(date: Date, weekStart: WeekStart): string {
	const d = dayjs(date);
	const year = d.year();
	const week = d.week();
	return `${year}-W${week.toString().padStart(2, "0")}.md`;
}

/**
 * Generates the week note path based on settings
 * @param date - The date within the week
 * @param settings - Plugin settings
 * @returns Full path to the week note
 */
export function getWeekNotePath(date: Date, settings: CalendarZSettings): string {
	const filename = getWeekNoteFilename(date, settings.weekStart);
	const folder = settings.weekNoteFolder.trim();
	if (folder) {
		return normalizePath(`${folder}/${filename}`);
	}
	return filename;
}

/**
 * Finds an existing week note for the given date
 * @param app - Obsidian App instance
 * @param date - The date within the week
 * @param settings - Plugin settings
 * @returns The existing TFile if found, null otherwise
 */
export function findWeekNote(app: App, date: Date, settings: CalendarZSettings): TFile | null {
	const path = getWeekNotePath(date, settings);
	const file = app.vault.getFileByPath(path);
	return file || null;
}

/**
 * Gets the week date range for display
 * @param date - The date within the week
 * @param weekStart - Week start preference
 * @returns Formatted date range string (e.g., "Jan 01 - Jan 07")
 */
export function getWeekDateRange(date: Date, weekStart: WeekStart): string {
	const d = dayjs(date);
	const startOfWeek = d.startOf("week");
	const endOfWeek = d.endOf("week");
	return `${startOfWeek.format("MMM DD")} - ${endOfWeek.format("MMM DD")}`;
}

/**
 * Creates week note content
 * @param app - Obsidian App instance
 * @param date - The date within the week
 * @param settings - Plugin settings
 * @returns Note content string
 */
async function createWeekNoteContent(
	app: App,
	date: Date,
	settings: CalendarZSettings
): Promise<string> {
	// Try to load template if specified
	if (settings.weekNoteTemplate) {
		const templateFile = app.vault.getFileByPath(settings.weekNoteTemplate);
		if (templateFile) {
			const d = dayjs(date);
			const year = d.year();
			const week = d.week();
			const dateRange = getWeekDateRange(date, settings.weekStart);
			const templateContent = await app.vault.read(templateFile);
			return templateContent
				.replace(/{{year}}/g, year.toString())
				.replace(/{{week}}/g, week.toString().padStart(2, "0"))
				.replace(/{{dateRange}}/g, dateRange)
				.replace(/{{date}}/g, d.format("YYYY-MM-DD"));
		}
	}

	// Default: empty content
	return "";
}

/**
 * Ensures the week note folder exists
 * @param app - Obsidian App instance
 * @param settings - Plugin settings
 */
async function ensureWeekNoteFolder(app: App, settings: CalendarZSettings): Promise<void> {
	const folder = settings.weekNoteFolder.trim();
	if (!folder) return;

	const folderPath = normalizePath(folder);
	const existingFolder = app.vault.getFolderByPath(folderPath);
	if (!existingFolder) {
		await app.vault.createFolder(folderPath);
	}
}

/**
 * Opens an existing week note or creates a new one for the given date
 * @param app - Obsidian App instance
 * @param i18n - Internationalization strings
 * @param date - The date within the week
 * @param settings - Plugin settings
 * @returns Promise that resolves when the note is opened/created
 */
export async function openOrCreateWeekNote(
	app: App,
	i18n: I18n,
	date: Date,
	settings: CalendarZSettings
): Promise<void> {
	try {
		// Check if week note feature is enabled
		if (!settings.weekNoteEnabled) {
			return;
		}

		// Find existing week note
		const existingNote = findWeekNote(app, date, settings);

		// If note exists, open it
		if (existingNote) {
			await app.workspace.openLinkText(existingNote.path, "", false);
			return;
		}

		// Ensure folder exists
		await ensureWeekNoteFolder(app, settings);

		// Create new week note
		const path = getWeekNotePath(date, settings);
		const content = await createWeekNoteContent(app, date, settings);
		const file = await app.vault.create(path, content);

		// Open the newly created note
		await app.workspace.openLinkText(file.path, "", false);
	} catch (error) {
		console.error("Failed to create week note:", error);
		new Notice(i18n.notifications.weekNoteCreateFailed || "Failed to create week note");
	}
}
