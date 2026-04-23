import { Setting } from "obsidian";
import CalendarZ from "../../main";

export type OnChangeHandler<T> = (value: T) => void | Promise<void>;

export interface SettingConfig<T> {
	name: string;
	description: string | DocumentFragment;
	value: T;
	onChange: OnChangeHandler<T>;
}

/**
 * Base class for setting renderers
 * Provides common functionality for rendering settings
 */
export abstract class SettingRenderer<T> {
	constructor(protected plugin: CalendarZ) {}

	abstract render(container: HTMLElement, config: SettingConfig<T>): void;

	protected createBaseSetting(container: HTMLElement, config: SettingConfig<T>): Setting {
		return new Setting(container)
			.setName(config.name)
			.setDesc(config.description);
	}
}

/**
 * Dropdown setting renderer
 */
export class DropdownSettingRenderer<T extends string> extends SettingRenderer<T> {
	constructor(
		plugin: CalendarZ,
		private options: Record<string, string>
	) {
		super(plugin);
	}

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
 */
export class ToggleSettingRenderer extends SettingRenderer<boolean> {
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
 */
export class TextSettingRenderer extends SettingRenderer<string> {
	constructor(private placeholder = "") {
		super({} as CalendarZ);
	}

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
 */
export class SliderSettingRenderer extends SettingRenderer<number> {
	constructor(
		private min: number,
		private max: number,
		private step: number
	) {
		super({} as CalendarZ);
	}

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
 */
export class ButtonSettingRenderer extends SettingRenderer<void> {
	constructor(private buttonText: string) {
		super({} as CalendarZ);
	}

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
