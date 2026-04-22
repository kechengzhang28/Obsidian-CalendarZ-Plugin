import { WeekStart } from "../settings";

export interface DateCount {
	date: string;
	count: number;
}

export class HeatMap {
	private container: HTMLElement;
	private weekStart: WeekStart;
	private dateCounts: Map<string, number> = new Map();

	constructor(
		container: HTMLElement,
		weekStart: WeekStart
	) {
		this.container = container;
		this.weekStart = weekStart;
	}

	render(currentDate: Date, dateCounts: DateCount[]): void {
		this.dateCounts.clear();
		for (const item of dateCounts) {
			this.dateCounts.set(item.date, item.count);
		}

		const heatMapGrid = this.container.createDiv({ cls: "calendarz-heatmap" });

		const year = currentDate.getFullYear();
		const month = currentDate.getMonth();

		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const daysInMonth = lastDay.getDate();
		const startingDayOfWeek = this.getAdjustedDayOfWeek(firstDay.getDay());

		const prevMonthLastDay = new Date(year, month, 0).getDate();
		for (let i = startingDayOfWeek - 1; i >= 0; i--) {
			const prevDay = prevMonthLastDay - i;
			const dayEl = heatMapGrid.createDiv({ cls: "calendarz-heatmap-day calendarz-heatmap-day-other-month" });
			dayEl.textContent = "";
		}

		const maxCount = this.getMaxCount();

		for (let day = 1; day <= daysInMonth; day++) {
			const date = new Date(year, month, day);
			const dateStr = this.formatDate(date);
			const count = this.dateCounts.get(dateStr) || 0;

			const dayEl = heatMapGrid.createDiv({ cls: "calendarz-heatmap-day" });
			dayEl.textContent = "";

			const intensity = maxCount > 0 ? count / maxCount : 0;
			const opacity = count > 0 ? 0.25 + intensity * 0.75 : 0.15;
			dayEl.style.opacity = opacity.toString();

			if (count > 0) {
				dayEl.setAttribute("data-count", count.toString());
			}

			dayEl.setAttribute("data-date", dateStr);
			dayEl.setAttribute("aria-label", `${dateStr}: ${count} notes`);
		}

		const totalCells = 42;
		const currentCells = startingDayOfWeek + daysInMonth;
		const nextMonthDays = totalCells - currentCells;

		for (let day = 1; day <= nextMonthDays; day++) {
			const dayEl = heatMapGrid.createDiv({ cls: "calendarz-heatmap-day calendarz-heatmap-day-other-month" });
			dayEl.textContent = "";
		}
	}

	private getMaxCount(): number {
		let max = 0;
		for (const count of this.dateCounts.values()) {
			if (count > max) {
				max = count;
			}
		}
		return max;
	}

	private formatDate(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	}

	private getAdjustedDayOfWeek(dayOfWeek: number): number {
		if (this.weekStart === "monday") {
			return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
		}
		return dayOfWeek;
	}
}
