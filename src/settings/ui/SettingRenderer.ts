import { Setting } from "obsidian";
import CalendarZ from "../../main";

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
	 * @param plugin - CalendarZ plugin instance for accessing settings
	 */
	constructor(protected plugin: CalendarZ) {}

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
	 * @param plugin - CalendarZ plugin instance
	 * @param options - Map of option values to their display labels
	 */
	constructor(
		plugin: CalendarZ,
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
 */
export class TextSettingRenderer extends SettingRenderer<string> {
	/**
	 * Creates a new text setting renderer
	 * @param placeholder - Placeholder text for the input field
	 */
	constructor(private placeholder = "") {
		super({} as CalendarZ);
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
 */
export class SliderSettingRenderer extends SettingRenderer<number> {
	/**
	 * Creates a new slider setting renderer
	 * @param min - Minimum value
	 * @param max - Maximum value
	 * @param step - Step increment
	 */
	constructor(
		private min: number,
		private max: number,
		private step: number
	) {
		super({} as CalendarZ);
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

/**
 * Button setting renderer
 * Renders a setting with an action button
 * Used for settings that trigger an action rather than store a value
 */
export class ButtonSettingRenderer extends SettingRenderer<void> {
	/**
	 * Creates a new button setting renderer
	 * @param buttonText - Text to display on the button
	 */
	constructor(private buttonText: string) {
		super({} as CalendarZ);
	}

	/**
	 * Renders the button setting
	 */
	render(container: HTMLElement, config: SettingConfig<void>): void {
		this.createBaseSetting(container, config).addButton(button =>
			button
				.setButtonText(this.buttonText)
				.onClick(() => {
					void config.onChange(undefined);
				})
		);
	}
}
