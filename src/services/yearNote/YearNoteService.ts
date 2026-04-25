/**
 * Year note service
 * Handles year note filename generation, finding, and creation
 */

import { App, Notice, TFile, normalizePath } from "obsidian";
import type { CalendarZSettings } from "../../core/types";
import type { I18nLike } from "../../core/types";
import dayjs from "../../utils/date/dayjsConfig";

function parseYearNoteFormat(format: string, year: number): string {
	let result = format;
	result = result.replace(/YYYY/g, year.toString());
	result = result.replace(/\[([^\]]+)\]/g, "$1");
	return result;
}

export class YearNoteService {
	constructor(private app: App) {}

	getYearNoteFilename(date: Date, settings: CalendarZSettings): string {
		const d = dayjs(date);
		const year = d.year();
		const format = settings.yearNoteFormat || "YYYY";
		const filename = parseYearNoteFormat(format, year);
		return `${filename}.md`;
	}

	getYearNotePath(date: Date, settings: CalendarZSettings): string {
		const filename = this.getYearNoteFilename(date, settings);
		const folder = settings.yearNoteFolder.trim();
		if (folder) {
			return normalizePath(`${folder}/${filename}`);
		}
		return filename;
	}

	findYearNote(date: Date, settings: CalendarZSettings): TFile | null {
		const path = this.getYearNotePath(date, settings);
		const file = this.app.vault.getFileByPath(path);
		return file || null;
	}

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
