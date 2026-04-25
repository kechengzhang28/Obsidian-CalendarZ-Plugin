/**
 * Week note service
 * Handles week note filename generation, finding, and creation
 */

import { App, Notice, TFile, normalizePath } from "obsidian";
import type { CalendarZSettings, WeekStart } from "../../core/types";
import type { I18nLike } from "../../core/types";
import dayjs, { setWeekStart } from "../../utils/date/dayjsConfig";

function parseWeekNoteFormat(format: string, year: number, week: number): string {
	let result = format;
	result = result.replace(/YYYY/g, year.toString());
	result = result.replace(/WW/g, week.toString().padStart(2, "0"));
	result = result.replace(/\[([^\]]+)\]/g, "$1");
	return result;
}

export class WeekNoteService {
	constructor(private app: App) {}

	getWeekNoteFilename(date: Date, settings: CalendarZSettings): string {
		setWeekStart(settings.weekStart);
		const d = dayjs(date);
		const year = d.year();
		const week = d.week();
		const format = settings.weekNoteFormat || "YYYY-[W]WW";
		const filename = parseWeekNoteFormat(format, year, week);
		return `${filename}.md`;
	}

	getWeekNotePath(date: Date, settings: CalendarZSettings): string {
		const filename = this.getWeekNoteFilename(date, settings);
		const folder = settings.weekNoteFolder.trim();
		if (folder) {
			return normalizePath(`${folder}/${filename}`);
		}
		return filename;
	}

	findWeekNote(date: Date, settings: CalendarZSettings): TFile | null {
		const path = this.getWeekNotePath(date, settings);
		const file = this.app.vault.getFileByPath(path);
		return file || null;
	}

	getWeekDateRange(date: Date, weekStart: WeekStart): string {
		setWeekStart(weekStart);
		const d = dayjs(date);
		const startOfWeek = d.startOf("week");
		const endOfWeek = d.endOf("week");
		return `${startOfWeek.format("MMM DD")} - ${endOfWeek.format("MMM DD")}`;
	}

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
