import { Component } from "../../core/Component";

/**
 * Configuration options for Button component
 */
export interface ButtonConfig {
	/** Button text content */
	text?: string;
	/** Additional CSS class names */
	className?: string;
	/** Whether this is a call-to-action button (primary style) */
	cta?: boolean;
	/** Click event handler */
	onClick: () => void;
}

/**
 * Reusable button component
 * Wraps a standard HTML button with consistent styling and event handling
 * 
 * @example
 * ```typescript
 * const button = new Button({
 *   text: 'Save',
 *   cta: true,
 *   onClick: () => saveData()
 * });
 * button.render(container);
 * ```
 */
export class Button extends Component {
	/** The underlying button element */
	private buttonEl: HTMLButtonElement | null = null;

	/**
	 * Creates a new Button component
	 * @param config - Button configuration
	 */
	constructor(private config: ButtonConfig) {
		super();
	}

	/**
	 * Renders the button into the given container
	 * @param container - Parent element to render into
	 */
	render(container: HTMLElement): void {
		this.buttonEl = container.createEl("button", {
			cls: this.config.className,
			text: this.config.text,
		});

		if (this.config.cta) {
			this.buttonEl.classList.add("mod-cta");
		}

		this.buttonEl.addEventListener("click", this.config.onClick);
		this.disposables.addCallback(() => {
			this.buttonEl?.removeEventListener("click", this.config.onClick);
		});

		this.container = this.buttonEl;
		this.isRendered = true;
	}

	/**
	 * Updates the button text
	 * @param text - New button text
	 */
	setText(text: string): void {
		if (this.buttonEl) {
			this.buttonEl.textContent = text;
		}
	}

	/**
	 * Sets the disabled state of the button
	 * @param disabled - Whether the button should be disabled
	 */
	setDisabled(disabled: boolean): void {
		if (this.buttonEl) {
			this.buttonEl.disabled = disabled;
		}
	}
}

/**
 * Icon button component with SVG arrow icons
 * Used for navigation controls (previous/next)
 * 
 * @example
 * ```typescript
 * const prevBtn = new IconButton('prev', () => goToPrevious());
 * prevBtn.render(header);
 * ```
 */
export class IconButton extends Component {
	/** The underlying button element */
	private buttonEl: HTMLButtonElement | null = null;

	/**
	 * Creates a new IconButton
	 * @param direction - Arrow direction ('prev' or 'next')
	 * @param onClick - Click event handler
	 * @param className - Additional CSS class names
	 */
	constructor(
		private direction: "prev" | "next",
		private onClick: () => void,
		private className = "calendarz-nav-btn"
	) {
		super();
	}

	/**
	 * Renders the icon button into the given container
	 * @param container - Parent element to render into
	 */
	render(container: HTMLElement): void {
		this.buttonEl = container.createEl("button", { cls: this.className });
		this.buttonEl.appendChild(this.createSvgIcon());
		this.buttonEl.addEventListener("click", this.onClick);

		this.disposables.addCallback(() => {
			this.buttonEl?.removeEventListener("click", this.onClick);
		});

		this.container = this.buttonEl;
		this.isRendered = true;
	}

	/**
	 * Creates the SVG arrow icon
	 * @returns SVG element for the arrow
	 */
	private createSvgIcon(): SVGSVGElement {
		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute("viewBox", "0 0 24 24");
		svg.setAttribute("width", "16");
		svg.setAttribute("height", "16");
		svg.setAttribute("fill", "none");
		svg.setAttribute("stroke", "currentColor");
		svg.setAttribute("stroke-width", "2");

		const points = this.direction === "prev" ? "15 18 9 12 15 6" : "9 18 15 12 9 6";
		const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
		polyline.setAttribute("points", points);
		svg.appendChild(polyline);

		return svg;
	}
}
