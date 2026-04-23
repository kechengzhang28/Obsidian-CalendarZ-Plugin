/**
 * Setting UI renderers for the CalendarZ plugin
 * 
 * This module provides reusable renderers for different types of settings
 * in the Obsidian settings panel. Each renderer creates a consistent
 * user interface for configuration options.
 * 
 * Available renderers:
 * - DropdownSettingRenderer: Select from predefined options
 * - ToggleSettingRenderer: Boolean on/off switch
 * - TextSettingRenderer: Text input field
 * - SliderSettingRenderer: Numeric slider with range
 * - ButtonSettingRenderer: Action button
 * 
 * Usage:
 * ```typescript
 * const renderer = new DropdownSettingRenderer(plugin, options);
 * renderer.render(container, {
 *   name: 'Setting Name',
 *   description: 'Setting description',
 *   value: currentValue,
 *   onChange: async (newValue) => {
 *     // Handle value change
 *   }
 * });
 * ```
 */

export * from "./SettingRenderer";
