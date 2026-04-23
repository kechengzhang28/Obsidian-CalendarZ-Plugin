/**
 * Configuration options for SettingGroup component
 */
export interface SettingGroupConfig {
	/** Group title/heading text */
	title: string;
	/** Additional CSS class names for the group container */
	className?: string;
}

/**
 * Reusable setting group component
 * Creates a container with heading and content area for settings
 *
 * Provides consistent styling and structure for grouping related settings.
 * The content area can be accessed via getContentEl() to add individual settings.
 *
 * @example
 * ```typescript
 * const group = new SettingGroup({ title: 'Basic Settings' });
 * group.render(container);
 *
 * const contentEl = group.getContentEl();
 * if (contentEl) {
 *   new Setting(contentEl)
 *     .setName('Option')
 *     .addToggle(toggle => toggle.setValue(true));
 * }
 * ```
 */
export class SettingGroup {
	/** Container element for settings content */
	private contentEl: HTMLElement | null = null;
	/** Group container element */
	private container: HTMLElement | null = null;

	/**
	 * Creates a new SettingGroup
	 * @param config - Group configuration
	 */
	constructor(private config: SettingGroupConfig) {}

	/**
	 * Renders the setting group into the given container
	 * Creates the group structure with heading and content area
	 * @param container - Parent element to render into
	 */
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
	}

	/**
	 * Gets the content element for adding settings
	 * @returns The content container element, or null if not rendered
	 */
	getContentEl(): HTMLElement | null {
		return this.contentEl;
	}
}
