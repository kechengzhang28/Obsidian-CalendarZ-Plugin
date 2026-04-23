import { DisplayStrategy, DayDisplayConfig, DisplayContext } from "./DisplayStrategy";
import { CSS_CLASSES, ATTRS, DOTS } from "../constants";
import { calculateDotCount } from "../utils/dateUtils";

/**
 * Dots display strategy
 * Shows visual dots representing note count
 */
export class DotsStrategy implements DisplayStrategy {
	apply(dayEl: HTMLElement, config: DayDisplayConfig, context: DisplayContext): void {
		const container = dayEl.createDiv({ cls: CSS_CLASSES.DOTS_CONTAINER });

		if (config.count > 0) {
			const numDots = calculateDotCount(config.count, context.dotThreshold, DOTS.MAX_DOTS);
			for (let i = 0; i < numDots; i++) {
				container.createDiv({ cls: CSS_CLASSES.DOT });
			}
		} else if (config.isBeforeToday) {
			container.createDiv({ cls: `${CSS_CLASSES.DOT} ${CSS_CLASSES.DOT_GRAY}` });
		}

		if (config.count > 0 || config.isBeforeToday) {
			dayEl.setAttribute(ATTRS.ARIA_LABEL, `${context.dateStr}: ${config.count} notes`);
		}
	}

	cleanup(dayEl: HTMLElement): void {
		dayEl.querySelectorAll(`.${CSS_CLASSES.DOTS_CONTAINER}`).forEach(el => el.remove());
		dayEl.removeAttribute(ATTRS.ARIA_LABEL);
	}
}
