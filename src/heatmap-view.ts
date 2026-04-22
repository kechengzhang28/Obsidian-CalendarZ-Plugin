import { ItemView, WorkspaceLeaf } from "obsidian";

export const VIEW_TYPE_HEATMAP = "calendarz-heatmap-view";

export class HeatmapView extends ItemView {
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_HEATMAP;
	}

	getDisplayText(): string {
		return "Note Heatmap";
	}

	async onOpen() {
		await this.render();
		this.registerEvent(this.app.metadataCache.on("changed", () => {
			this.render();
		}));
		this.registerEvent(this.app.vault.on("create", () => {
			this.render();
		}));
		this.registerEvent(this.app.vault.on("delete", () => {
			this.render();
		}));
	}

	async onClose() {
		// Cleanup
	}

	async render() {
		const container = this.containerEl.children[1] as HTMLElement | undefined;
		if (!container) return;

		container.empty();
		container.addClass("calendarz-heatmap-container");

		const header = container.createEl("div", { cls: "calendarz-heatmap-header" });
		header.createEl("h3", { text: "Note Activity Heatmap", cls: "calendarz-heatmap-title" });

		const dateCounts = await this.getDateCounts();
		const heatmapContainer = container.createEl("div", { cls: "calendarz-heatmap" });

		this.renderHeatmap(heatmapContainer, dateCounts);
	}

	async getDateCounts(): Promise<Map<string, number>> {
		const dateCounts = new Map<string, number>();
		const files = this.app.vault.getMarkdownFiles();

		for (const file of files) {
			const cache = this.app.metadataCache.getFileCache(file);
			if (cache?.frontmatter?.date) {
				const dateStr = this.normalizeDate(cache.frontmatter.date);
				if (dateStr) {
					const count = dateCounts.get(dateStr) || 0;
					dateCounts.set(dateStr, count + 1);
				}
			}
		}

		return dateCounts;
	}

	normalizeDate(dateValue: unknown): string | null {
		if (!dateValue) return null;

		let date: Date | null = null;

		if (typeof dateValue === "string") {
			date = new Date(dateValue);
		} else if (typeof dateValue === "number") {
			date = new Date(dateValue);
		} else if (dateValue instanceof Date) {
			date = dateValue;
		}

		if (date && !isNaN(date.getTime())) {
			const isoString = date.toISOString().split("T")[0];
			return isoString ?? null;
		}

		return null;
	}

	renderHeatmap(container: HTMLElement, dateCounts: Map<string, number>) {
		const today = new Date();
		const weeksToShow = 26;
		const daysToShow = weeksToShow * 7;
		const startDate = new Date(today);
		startDate.setDate(today.getDate() - daysToShow);

		const maxCount = Math.max(...Array.from(dateCounts.values()), 1);

		const wrapper = container.createEl("div", { cls: "calendarz-heatmap-wrapper" });

		const monthLabels = wrapper.createEl("div", { cls: "calendarz-heatmap-months" });
		this.renderMonthLabels(monthLabels, startDate, today);

		const gridWrapper = wrapper.createEl("div", { cls: "calendarz-heatmap-grid-wrapper" });

		const dayLabels = gridWrapper.createEl("div", { cls: "calendarz-heatmap-day-labels" });
		this.renderDayLabels(dayLabels);

		const grid = gridWrapper.createEl("div", { cls: "calendarz-heatmap-grid" });

		for (let week = 0; week < weeksToShow; week++) {
			const weekEl = grid.createEl("div", { cls: "calendarz-heatmap-week" });

			for (let day = 0; day < 7; day++) {
				const currentDate = new Date(startDate);
				currentDate.setDate(startDate.getDate() + week * 7 + day);

				const dateStr = currentDate.toISOString().split("T")[0] ?? "";
				const count = dateCounts.get(dateStr) || 0;
				const level = this.getLevel(count, maxCount);

				const cell = weekEl.createEl("div", {
					cls: `calendarz-heatmap-cell calendarz-heatmap-level-${level}`,
					attr: {
						"data-date": dateStr,
						"data-count": String(count),
						title: `${dateStr}: ${count} notes`
					}
				});
			}
		}

		const legend = wrapper.createEl("div", { cls: "calendarz-heatmap-legend" });
		legend.createEl("span", { text: "Less", cls: "calendarz-heatmap-legend-label" });

		for (let i = 0; i <= 4; i++) {
			legend.createEl("div", {
				cls: `calendarz-heatmap-cell calendarz-heatmap-level-${i}`,
				attr: { title: `Level ${i}` }
			});
		}

		legend.createEl("span", { text: "More", cls: "calendarz-heatmap-legend-label" });
	}

	renderMonthLabels(container: HTMLElement, startDate: Date, endDate: Date) {
		const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		const weeksToShow = 26;
		const shownMonths = new Set<number>();

		for (let week = 0; week < weeksToShow; week += 4) {
			const currentDate = new Date(startDate);
			currentDate.setDate(startDate.getDate() + week * 7);
			const month = currentDate.getMonth();

			if (!shownMonths.has(month)) {
				shownMonths.add(month);
				container.createEl("span", {
					text: months[month],
					cls: "calendarz-heatmap-month-label"
				});
			}
		}
	}

	renderDayLabels(container: HTMLElement) {
		const days = ["Mon", "", "Wed", "", "Fri"];
		days.forEach(day => {
			container.createEl("span", { text: day, cls: "calendarz-heatmap-day-label" });
		});
	}

	getLevel(count: number, maxCount: number): number {
		if (count === 0) return 0;
		const ratio = count / maxCount;
		if (ratio <= 0.25) return 1;
		if (ratio <= 0.5) return 2;
		if (ratio <= 0.75) return 3;
		return 4;
	}
}
