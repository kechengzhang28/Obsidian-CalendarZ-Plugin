import { DisplayStrategy, DayDisplayConfig, DisplayContext } from "./DisplayStrategy";
import { CSS_CLASSES, CSS_VARS, ATTRS } from "../constants";
import { calculateHeatmapOpacity } from "../utils/date";

/**
 * Heatmap display strategy
 * Applies opacity-based coloring based on note count
 * 
 * Higher note counts result in darker/more opaque backgrounds.
 * The opacity is calculated relative to the maximum count in the current view.
 * 
 * Visual representation:
 * - 0 notes: No background color (or today indicator if applicable)
 * - 1+ notes: Background with opacity based on count/maxCount ratio
 */
export class HeatmapStrategy implements DisplayStrategy {
	/**
	 * Applies heatmap styling to a day element
	 * Sets CSS custom property for opacity and adds appropriate classes
	 */
	apply(dayEl: HTMLElement, config: DayDisplayConfig, context: DisplayContext): void {
		// No notes and not today - nothing to display
		if (config.count === 0) {
			if (config.isToday) {
				this.addTodayIndicator(dayEl);
			}
			return;
		}

		// Apply heatmap styling
		dayEl.addClass(CSS_CLASSES.DAY_HEATMAP);
		const opacity = calculateHeatmapOpacity(config.count, context.maxCount);
		dayEl.style.setProperty(CSS_VARS.HEATMAP_OPACITY, opacity.toFixed(2));
		dayEl.setAttribute(ATTRS.DATA_COUNT, String(config.count));
		dayEl.setAttribute(ATTRS.ARIA_LABEL, `${context.dateStr}: ${config.count} notes`);

		// Add today indicator if applicable
		if (config.isToday) {
			this.addTodayIndicator(dayEl);
		}
	}

	/**
	 * Removes all heatmap-related styling from the element
	 */
	cleanup(dayEl: HTMLElement): void {
		dayEl.removeClass(CSS_CLASSES.DAY_HEATMAP);
		dayEl.style.removeProperty(CSS_VARS.HEATMAP_OPACITY);
		dayEl.removeAttribute(ATTRS.DATA_COUNT);
		dayEl.querySelectorAll(`.${CSS_CLASSES.DOTS_CONTAINER}`).forEach(el => el.remove());
	}

	/**
	 * Adds a visual indicator for today's date
	 * Creates a small dot to mark the current day
	 */
	private addTodayIndicator(dayEl: HTMLElement): void {
		const indicator = dayEl.createDiv({ cls: CSS_CLASSES.DOTS_CONTAINER });
		indicator.createDiv({ cls: `${CSS_CLASSES.DOT} ${CSS_CLASSES.DOT_TODAY}` });
		indicator.setAttribute(ATTRS.ARIA_HIDDEN, "true");
	}
}
