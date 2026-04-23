import type { Disposable } from "./Disposable";
import { DisposableManager } from "./Disposable";

/**
 * Base class for UI components
 * Provides lifecycle management and disposable resource handling
 * 
 * Subclasses should implement render() to create the component's DOM structure
 * and can override update() to handle dynamic updates
 * 
 * @example
 * ```typescript
 * class MyComponent extends Component {
 *   render(container: HTMLElement): void {
 *     this.container = container.createDiv({ cls: 'my-component' });
 *     // Add content...
 *     this.isRendered = true;
 *   }
 * }
 * ```
 */
export abstract class Component implements Disposable {
	/** Manager for disposable resources */
	protected disposables = new DisposableManager();
	/** Container element for this component */
	protected container: HTMLElement | null = null;
	/** Whether the component has been rendered */
	protected isRendered = false;

	/**
	 * Renders the component into the given container
	 * Must be implemented by subclasses
	 * @param container - Parent element to render into
	 */
	abstract render(container: HTMLElement): void;

	/**
	 * Destroys the component and cleans up resources
	 * Removes all event listeners and clears references
	 */
	dispose(): void {
		this.disposables.dispose();
		this.container = null;
		this.isRendered = false;
	}
}
