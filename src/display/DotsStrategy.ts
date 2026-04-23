import { DisplayStrategy, DayDisplayConfig, DisplayContext } from "./DisplayStrategy";
import { CSS_CLASSES, ATTRS, DOTS } from "../constants";
import { calculateDotCount } from "../utils/dateUtils";

/**
 * Dots display strategy
 * Shows visual dots representing note count
 * 
 * Each dot represents a configurable number of notes (dotThreshold).
 * Days before today with no notes show a gray dot.
 * 
 * Visual representation:
 * - 0 notes, before today: Single gray dot
 * - 0 notes, today or future: No dots
 * - 1+ notes: 1-4 dots based on count/threshold
 */
export class DotsStrategy implements DisplayStrategy {
	/**
	 * Applies dots styling to a day element
	 * Creates a container with the appropriate number of dots
	 */
	apply(dayEl: HTMLElement, config: DayDisplayConfig, context: DisplayContext): void {
		const container = dayEl.createDiv({ cls: CSS_CLASSES.DOTS_CONTAINER });

		if (config.count > 0) {
			// Calculate number of dots based on count and threshold
			const numDots = calculateDotCount(config.count, context.dotThreshold, DOTS.MAX_DOTS);
			for (let i = 0; i < numDots; i++) {
				container.createDiv({ cls: CSS_CLASSES.DOT });
			}
		} else if (config.isBeforeToday) {
			// Show gray dot for past dates with no notes
			container.createDiv({ cls: `${CSS_CLASSES.DOT} ${CSS_CLASSES.DOT_GRAY}` });
		}

		// Set accessibility label if there's anything to show
		if (config.count > 0 || config.isBeforeToday) {
			dayEl.setAttribute(ATTRS.ARIA_LABEL, `${context.dateStr}: ${config.count} notes`);
		}
	}

	/**
	 * Removes all dots and related attributes from the element
	 */
	cleanup(dayEl: HTMLElement): void {
		dayEl.querySelectorAll(`.${CSS_CLASSES.DOTS_CONTAINER}`).forEach(el => el.remove());
		dayEl.removeAttribute(ATTRS.ARIA_LABEL);
	}
}
