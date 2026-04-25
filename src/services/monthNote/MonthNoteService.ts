/**
 * Month note service
 * Handles month note filename generation, finding, and creation
 */

import { App, Notice, TFile, normalizePath } from "obsidian";
import type { CalendarZSettings } from "../../core/types";
import type { I18nLike } from "../../core/types";
import dayjs from "../../utils/date/dayjsConfig";

function parseMonthNoteFormat(format: string, year: number, month: number): string {
	let result = format;
	result = result.replace(/YYYY/g, year.toString());
	result = result.replace(/MM/g, month.toString().padStart(2, "0"));
	result = result.replace(/\[([^\]]+)\]/g, "$1");
	return result;
}

export class MonthNoteService {
	constructor(private app: App) {}

	getMonthNoteFilename(date: Date, settings: CalendarZSettings): string {
		const d = dayjs(date);
		const year = d.year();
		const month = d.month() + 1;
		const format = settings.monthNoteFormat || "YYYY-MM";
		const filename = parseMonthNoteFormat(format, year, month);
		return `${filename}.md`;
	}

	getMonthNotePath(date: Date, settings: CalendarZSettings): string {
		const filename = this.getMonthNoteFilename(date, settings);
		const folder = settings.monthNoteFolder.trim();
		if (folder) {
			return normalizePath(`${folder}/${filename}`);
		}
		return filename;
	}

	findMonthNote(date: Date, settings: CalendarZSettings): TFile | null {
		const path = this.getMonthNotePath(date, settings);
		const file = this.app.vault.getFileByPath(path);
		return file || null;
	}

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
