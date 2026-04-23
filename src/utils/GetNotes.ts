import {App, parseYaml} from "obsidian";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import {DateCount} from "../ui/DaysGrid";
import {DATE_FORMAT} from "../constants";

dayjs.extend(customParseFormat);

const DATE_FORMATS = [
	"YYYY-MM-DD",
	"YYYY/MM/DD",
	"DD-MM-YYYY",
	"DD/MM/YYYY",
	"MM-DD-YYYY",
	"MM/DD/YYYY"
];

function isPathIgnored(filePath: string, ignoredFolders: string[]): boolean {
	const normalizedPath = filePath.replace(/\\/g, "/");
	return ignoredFolders.some(folder => {
		const normalizedFolder = folder.replace(/\\/g, "/").replace(/\/$/, "");
		return normalizedPath === normalizedFolder || normalizedPath.startsWith(normalizedFolder + "/");
	});
}

function parseDateString(dateStr: string): Date | null {
	if (!dateStr) return null;

	for (const format of DATE_FORMATS) {
		const parsed = dayjs(dateStr, format, true);
		if (parsed.isValid()) return parsed.toDate();
	}

	const isoParsed = dayjs(dateStr);
	return isoParsed.isValid() ? isoParsed.toDate() : null;
}

function extractDateFromFilename(filename: string, format: string): Date | null {
	const pattern = format
		.replace(/YYYY/g, "(\\d{4})")
		.replace(/MM/g, "(\\d{2})")
		.replace(/DD/g, "(\\d{2})")
		.replace(/[-/.]/g, "[-/.]");

	const regex = new RegExp(`^.*${pattern}.*$`);
	const match = filename.match(regex);

	if (!match) return null;

	const year = parseInt(match[1] ?? "0", 10);
	const month = parseInt(match[2] ?? "0", 10);
	const day = parseInt(match[3] ?? "0", 10);
	const date = dayjs(`${year}-${month}-${day}`, "YYYY-M-D", true);
	return date.isValid() ? date.toDate() : null;
}

function extractYamlFrontmatter(content: string): Record<string, unknown> | null {
	const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
	if (!match?.[1]) return null;

	try {
		const parsed = parseYaml(match[1]) as unknown;
		if (parsed && typeof parsed === "object") {
			return parsed as Record<string, unknown>;
		}
		return {};
	} catch {
		return null;
	}
}

function parseYamlDate(value: unknown): Date | null {
	if (value instanceof Date) return value;
	if (typeof value === "string") return parseDateString(value);
	if (typeof value === "number") return dayjs(value).toDate();

	if (value && typeof value === "object") {
		const obj = value as Record<string, unknown>;
		if ("year" in obj && "month" in obj && "day" in obj) {
			const year = String(obj.year);
			const month = String(obj.month);
			const day = String(obj.day);
			const date = dayjs(`${year}-${month}-${day}`, "YYYY-M-D");
			return date.isValid() ? date.toDate() : null;
		}
	}
	return null;
}

function countNotesByDate<T>(
	items: T[],
	isIgnored: (item: T) => boolean,
	extractDate: (item: T) => Date | null
): DateCount[] {
	const counts = new Map<string, number>();

	for (const item of items) {
		if (isIgnored(item)) continue;

		const date = extractDate(item);
		if (date) {
			const dateStr = dayjs(date).format(DATE_FORMAT);
			counts.set(dateStr, (counts.get(dateStr) || 0) + 1);
		}
	}

	return Array.from(counts.entries()).map(([date, count]) => ({ date, count }));
}

export function getNotesCountByFilenameDate(
	app: App,
	ignoredFolders: string[],
	filenameDateFormat: string
): DateCount[] {
	return countNotesByDate(
		app.vault.getFiles(),
		file => isPathIgnored(file.path, ignoredFolders),
		file => extractDateFromFilename(file.name.replace(/\.[^/.]+$/, ""), filenameDateFormat)
	);
}

export async function getNotesCountByYamlDate(
	app: App,
	ignoredFolders: string[],
	dateFieldName: string
): Promise<DateCount[]> {
	const files = app.vault.getMarkdownFiles();
	const counts = new Map<string, number>();

	for (const file of files) {
		if (isPathIgnored(file.path, ignoredFolders)) continue;

		try {
			const content = await app.vault.read(file);
			const frontmatter = extractYamlFrontmatter(content);
			const dateValue = frontmatter?.[dateFieldName];

			if (!dateValue) continue;

			const date = parseYamlDate(dateValue);
			if (date) {
				const dateStr = dayjs(date).format(DATE_FORMAT);
				counts.set(dateStr, (counts.get(dateStr) || 0) + 1);
			}
		} catch {
			// Skip files that can't be read
		}
	}

	return Array.from(counts.entries()).map(([date, count]) => ({ date, count }));
}
