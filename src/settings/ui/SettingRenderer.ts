import { Setting } from "obsidian";
import type { PluginLike } from "../../types";

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
 * Options for button setting renderer
 */
export interface ButtonConfig {
	/** Display name of the button setting */
	name: string;
	/** Description text */
	description: string | DocumentFragment;
	/** Button text */
	buttonText: string;
	/** Handler called when the button is clicked */
	onClick: () => void | Promise<void>;
	/** Whether this is a call-to-action button */
	cta?: boolean;
}

/**
 * Wraps an onChange handler to support both sync and async handlers
 */
async function handleChange<T>(handler: OnChangeHandler<T>, value: T): Promise<void> {
	await handler(value);
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
 *         .onChange((value) => this.onChange(config, value)));
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

	/**
	 * Standardized onChange wrapper that handles both sync and async handlers
	 * @param config - Setting configuration
	 * @param value - New value
	 */
	protected onChange(config: SettingConfig<T>, value: T): void {
		void handleChange(config.onChange, value);
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
				.onChange((value) => this.onChange(config, value as T));
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
				.onChange((value) => this.onChange(config, value))
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
	 * @param plugin - Plugin instance
	 * @param placeholder - Placeholder text for the input field
	 */
	constructor(
		plugin: PluginLike,
		private placeholder = ""
	) {
		super(plugin);
	}

	/**
	 * Renders the text input setting
	 */
	render(container: HTMLElement, config: SettingConfig<string>): void {
		this.createBaseSetting(container, config).addText(text =>
			text
				.setPlaceholder(this.placeholder)
				.setValue(config.value)
				.onChange((value) => this.onChange(config, value))
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
	 * @param plugin - Plugin instance
	 */
	constructor(
		private min: number,
		private max: number,
		private step: number,
		plugin: PluginLike
	) {
		super(plugin);
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
				.onChange((value) => this.onChange(config, value))
		);
	}
}

/**
 * Number input setting renderer
 * Renders a setting with a number input field
 */
export class NumberSettingRenderer extends SettingRenderer<number> {
	/**
	 * Creates a new number setting renderer
	 * @param plugin - Plugin instance
	 * @param min - Minimum value (default: 1)
	 * @param placeholder - Placeholder text for the input field
	 */
	constructor(
		plugin: PluginLike,
		private min = 1,
		private placeholder = ""
	) {
		super(plugin);
	}

	/**
	 * Renders the number input setting
	 */
	render(container: HTMLElement, config: SettingConfig<number>): void {
		this.createBaseSetting(container, config).addText(text => {
			text.inputEl.type = "number";
			text.inputEl.min = String(this.min);
			text.setPlaceholder(this.placeholder || String(this.min));
			text.setValue(String(config.value));
			text.onChange((value) => {
				const numValue = parseInt(value, 10);
				const validValue = isNaN(numValue) || numValue < this.min ? this.min : numValue;
				this.onChange(config, validValue);
			});
			return text;
		});
	}
}

/**
 * Button setting renderer
 * Renders a setting with a button control
 */
export class ButtonSettingRenderer {
	constructor(private plugin: PluginLike) {}

	/**
	 * Renders the button setting
	 */
	render(container: HTMLElement, config: ButtonConfig): void {
		const setting = new Setting(container)
			.setName(config.name)
			.setDesc(config.description);

		setting.addButton(button => {
			button.setButtonText(config.buttonText);
			if (config.cta) button.setCta();
			button.onClick(() => void config.onClick());
			return button;
		});
	}
}


