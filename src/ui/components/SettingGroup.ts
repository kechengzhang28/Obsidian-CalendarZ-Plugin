import { Component } from "../../core/Component";

export interface SettingGroupConfig {
	title: string;
	className?: string;
}

/**
 * Reusable setting group component
 * Creates a container with heading and content area
 */
export class SettingGroup extends Component {
	private contentEl: HTMLElement | null = null;

	constructor(private config: SettingGroupConfig) {
		super();
	}

	render(container: HTMLElement): void {
		const groupEl = container.createDiv({
			cls: this.config.className || "setting-group",
		});

		// Create heading
		const headingEl = groupEl.createDiv({ cls: "setting-item-heading" });
		headingEl.createEl("h3", { text: this.config.title });

		// Create content container
		this.contentEl = groupEl.createDiv({ cls: "setting-items" });

		this.container = groupEl;
		this.isRendered = true;
	}

	/**
	 * Gets the content element for adding settings
	 */
	getContentEl(): HTMLElement | null {
		return this.contentEl;
	}
}
