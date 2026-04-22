import { WeekStart } from "../settings";

export interface DaysGridCallbacks {
	onDateSelect: (date: Date) => void;
}

export class DaysGrid {
	private container: HTMLElement;
	private weekStart: WeekStart;
	private callbacks: DaysGridCallbacks;

	constructor(container: HTMLElement, weekStart: WeekStart, callbacks: DaysGridCallbacks) {
		this.container = container;
		this.weekStart = weekStart;
		this.callbacks = callbacks;
	}

	render(currentDate: Date, selectedDate: Date): void {
		const daysGrid = this.container.createDiv({ cls: "calendarz-days" });

		const year = currentDate.getFullYear();
		const month = currentDate.getMonth();

		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const daysInMonth = lastDay.getDate();
		const startingDayOfWeek = this.getAdjustedDayOfWeek(firstDay.getDay());

		const today = new Date();

		const prevMonthLastDay = new Date(year, month, 0).getDate();
		for (let i = startingDayOfWeek - 1; i >= 0; i--) {
			const prevDay = prevMonthLastDay - i;
			const dayEl = daysGrid.createDiv({ cls: "calendarz-day calendarz-day-other-month" });
			dayEl.textContent = prevDay.toString();
		}

		for (let day = 1; day <= daysInMonth; day++) {
			const date = new Date(year, month, day);
			const dayEl = daysGrid.createDiv({ cls: "calendarz-day" });
			dayEl.textContent = day.toString();

			if (this.isSameDate(date, today)) {
				dayEl.addClass("calendarz-day-today");
			}

			if (this.isSameDate(date, selectedDate)) {
				dayEl.addClass("calendarz-day-selected");
			}

			dayEl.addEventListener("click", () => {
				this.callbacks.onDateSelect(date);
			});
		}

		const totalCells = 42;
		const currentCells = startingDayOfWeek + daysInMonth;
		const nextMonthDays = totalCells - currentCells;

		for (let day = 1; day <= nextMonthDays; day++) {
			const dayEl = daysGrid.createDiv({ cls: "calendarz-day calendarz-day-other-month" });
			dayEl.textContent = day.toString();
		}
	}

	private isSameDate(date1: Date, date2: Date): boolean {
		return date1.getFullYear() === date2.getFullYear() &&
			date1.getMonth() === date2.getMonth() &&
			date1.getDate() === date2.getDate();
	}

	private getAdjustedDayOfWeek(dayOfWeek: number): number {
		if (this.weekStart === "monday") {
			return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
		}
		return dayOfWeek;
	}
}
