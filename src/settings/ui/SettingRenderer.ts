import { Setting } from "obsidian";
import { PluginLike } from "../../types";

/**
 * Handler function type for setting value changes
 * Can be synchronous or asynchronous
 */
export type OnChangeHandler<T> = (value: T) => void | Promise<void>;

/**
 * Configuration interface for settings
 * Defines the common properties needed to render any setting type
 */
export interface SettingConfig<T> {
	/** Display name of the setting */
	name: string;
	/** Description text or DocumentFragment explaining the setting */
	description: string | DocumentFragment;
	/** Current value of the setting */
	value: T;
	/** Handler called when the setting value changes */
	onChange: OnChangeHandler<T>;
}

/**
 * Base class for setting renderers
 * Provides common functionality for rendering settings in the Obsidian settings panel
 * 
 * Subclasses should implement render() to create specific setting types
 * (dropdowns, toggles, sliders, etc.)
 * 
 * @example
 * ```typescript
 * class CustomSettingRenderer extends SettingRenderer<string> {
 *   render(container: HTMLElement, config: SettingConfig<string>): void {
 *     this.createBaseSetting(container, config)
 *       .addText(text => text
 *         .setValue(config.value)
 *         .onChange(async (value) => {
 *           await config.onChange(value);
 *         }));
 *   }
 * }
 * ```
 */
export abstract class SettingRenderer<T> {
	/**
	 * Creates a new setting renderer
	 * @param plugin - Plugin instance for accessing settings
	 */
	constructor(protected plugin: PluginLike) {}

	/**
	 * Renders the setting into the given container
	 * Must be implemented by subclasses
	 * @param container - Parent element to render into
	 * @param config - Setting configuration
	 */
	abstract render(container: HTMLElement, config: SettingConfig<T>): void;

	/**
	 * Creates the base Setting object with name and description
	 * Subclasses should call this before adding their specific control
	 * @param container - Parent element
	 * @param config - Setting configuration
	 * @returns Obsidian Setting instance
	 */
	protected createBaseSetting(container: HTMLElement, config: SettingConfig<T>): Setting {
		return new Setting(container)
			.setName(config.name)
			.setDesc(config.description);
	}
}

/**
 * Dropdown setting renderer
 * Renders a setting with a dropdown select control
 * 
 * @example
 * ```typescript
 * const renderer = new DropdownSettingRenderer(plugin, {
 *   option1: 'Option 1 Label',
 *   option2: 'Option 2 Label'
 * });
 * renderer.render(container, {
 *   name: 'My Setting',
 *   description: 'Choose an option',
 *   value: 'option1',
 *   onChange: async (value) => { // handle change }
 * });
 * ```
 */
export class DropdownSettingRenderer<T extends string> extends SettingRenderer<T> {
	/**
	 * Creates a new dropdown setting renderer
	 * @param plugin - Plugin instance
	 * @param options - Map of option values to their display labels
	 */
	constructor(
		plugin: PluginLike,
		private options: Record<string, string>
	) {
		super(plugin);
	}

	/**
	 * Renders the dropdown setting
	 */
	render(container: HTMLElement, config: SettingConfig<T>): void {
		this.createBaseSetting(container, config).addDropdown(dropdown => {
			for (const [value, label] of Object.entries(this.options)) {
				dropdown.addOption(value, label);
			}
			return dropdown
				.setValue(config.value)
				.onChange(async (value) => {
					await config.onChange(value as T);
				});
		});
	}
}

/**
 * Toggle setting renderer
 * Renders a setting with a boolean toggle switch
 */
export class ToggleSettingRenderer extends SettingRenderer<boolean> {
	/**
	 * Renders the toggle setting
	 */
	render(container: HTMLElement, config: SettingConfig<boolean>): void {
		this.createBaseSetting(container, config).addToggle(toggle =>
			toggle
				.setValue(config.value)
				.onChange(async (value) => {
					await config.onChange(value);
				})
		);
	}
}

/**
 * Text input setting renderer
 * Renders a setting with a text input field
 * 
 * Note: This renderer does not require a plugin instance as it only renders
 * a simple text input with no plugin-specific functionality.
 */
export class TextSettingRenderer extends SettingRenderer<string> {
	/**
	 * Creates a new text setting renderer
	 * @param placeholder - Placeholder text for the input field
	 */
	constructor(
		plugin: PluginLike | null = null,
		private placeholder = ""
	) {
		super(plugin ?? {} as PluginLike);
	}

	/**
	 * Renders the text input setting
	 */
	render(container: HTMLElement, config: SettingConfig<string>): void {
		this.createBaseSetting(container, config).addText(text =>
			text
				.setPlaceholder(this.placeholder)
				.setValue(config.value)
				.onChange(async (value) => {
					await config.onChange(value);
				})
		);
	}
}

/**
 * Slider setting renderer
 * Renders a setting with a numeric slider control
 * 
 * Note: This renderer does not require a plugin instance as it only renders
 * a simple slider with no plugin-specific functionality.
 */
export class SliderSettingRenderer extends SettingRenderer<number> {
	/**
	 * Creates a new slider setting renderer
	 * @param min - Minimum value
	 * @param max - Maximum value
	 * @param step - Step increment
	 * @param plugin - Optional plugin instance
	 */
	constructor(
		private min: number,
		private max: number,
		private step: number,
		plugin: PluginLike | null = null
	) {
		super(plugin ?? {} as PluginLike);
	}

	/**
	 * Renders the slider setting
	 */
	render(container: HTMLElement, config: SettingConfig<number>): void {
		this.createBaseSetting(container, config).addSlider(slider =>
			slider
				.setLimits(this.min, this.max, this.step)
				.setValue(config.value)
				.setDynamicTooltip()
				.onChange(async (value) => {
					await config.onChange(value);
				})
		);
	}
}


