import { DisplayStrategy, DayDisplayConfig, DisplayContext } from "./DisplayStrategy";
import { CSS_CLASSES, CSS_VARS, ATTRS } from "../constants";
import { calculateHeatmapOpacity } from "../utils/dateUtils";

/**
 * Heatmap display strategy
 * Applies opacity-based coloring based on note count
 */
export class HeatmapStrategy implements DisplayStrategy {
	apply(dayEl: HTMLElement, config: DayDisplayConfig, context: DisplayContext): void {
		if (config.count === 0) {
			if (config.isToday) {
				this.addTodayIndicator(dayEl);
			}
			return;
		}

		dayEl.addClass(CSS_CLASSES.DAY_HEATMAP);
		const opacity = calculateHeatmapOpacity(config.count, context.maxCount);
		dayEl.style.setProperty(CSS_VARS.HEATMAP_OPACITY, opacity.toFixed(2));
		dayEl.setAttribute(ATTRS.DATA_COUNT, String(config.count));
		dayEl.setAttribute(ATTRS.ARIA_LABEL, `${context.dateStr}: ${config.count} notes`);

		if (config.isToday) {
			this.addTodayIndicator(dayEl);
		}
	}

	cleanup(dayEl: HTMLElement): void {
		dayEl.removeClass(CSS_CLASSES.DAY_HEATMAP);
		dayEl.style.removeProperty(CSS_VARS.HEATMAP_OPACITY);
		dayEl.removeAttribute(ATTRS.DATA_COUNT);
		dayEl.querySelectorAll(`.${CSS_CLASSES.DOTS_CONTAINER}`).forEach(el => el.remove());
	}

	private addTodayIndicator(dayEl: HTMLElement): void {
		const indicator = dayEl.createDiv({ cls: CSS_CLASSES.DOTS_CONTAINER });
		indicator.createDiv({ cls: `${CSS_CLASSES.DOT} ${CSS_CLASSES.DOT_TODAY}` });
		indicator.setAttribute(ATTRS.ARIA_HIDDEN, "true");
	}
}
