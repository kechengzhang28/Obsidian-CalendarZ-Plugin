import { Component } from "../../core/Component";

export interface ButtonConfig {
	text?: string;
	className?: string;
	cta?: boolean;
	onClick: () => void;
}

/**
 * Reusable button component
 */
export class Button extends Component {
	private buttonEl: HTMLButtonElement | null = null;

	constructor(private config: ButtonConfig) {
		super();
	}

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

	setText(text: string): void {
		if (this.buttonEl) {
			this.buttonEl.textContent = text;
		}
	}

	setDisabled(disabled: boolean): void {
		if (this.buttonEl) {
			this.buttonEl.disabled = disabled;
		}
	}
}

/**
 * Creates an SVG icon button
 */
export class IconButton extends Component {
	private buttonEl: HTMLButtonElement | null = null;

	constructor(
		private direction: "prev" | "next",
		private onClick: () => void,
		private className = "calendarz-nav-btn"
	) {
		super();
	}

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
