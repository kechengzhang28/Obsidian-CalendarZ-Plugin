import { Disposable, DisposableManager } from "./Disposable";

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
	 * Updates the component with new data/state
	 * Override in subclasses for dynamic updates without full re-render
	 */
	update(): void {
		// Default: no-op, override in subclasses
	}

	/**
	 * Destroys the component and cleans up resources
	 * Removes all event listeners and clears references
	 */
	dispose(): void {
		this.disposables.dispose();
		this.container = null;
		this.isRendered = false;
	}

	/**
	 * Gets the component's container element
	 * @returns The container element or null if not rendered
	 */
	getContainer(): HTMLElement | null {
		return this.container;
	}

	/**
	 * Checks if the component has been rendered
	 * @returns True if render() has been called
	 */
	getIsRendered(): boolean {
		return this.isRendered;
	}
}

/**
 * Base class for container components that manage child components
 * Automatically disposes child components when removed or when this container is disposed
 * 
 * @example
 * ```typescript
 * class Panel extends ContainerComponent {
 *   render(container: HTMLElement): void {
 *     this.container = container.createDiv({ cls: 'panel' });
 *     const child = new ChildComponent();
 *     child.render(this.container);
 *     this.addChild(child);
 *   }
 * }
 * ```
 */
export abstract class ContainerComponent extends Component {
	/** Child components managed by this container */
	protected children: Component[] = [];

	/**
	 * Adds a child component to be managed
	 * The child will be disposed when this container is disposed
	 * @param child - Child component to add
	 */
	addChild(child: Component): void {
		this.children.push(child);
	}

	/**
	 * Removes a child component and disposes it
	 * @param child - Child component to remove
	 */
	removeChild(child: Component): void {
		const index = this.children.indexOf(child);
		if (index !== -1) {
			child.dispose();
			this.children.splice(index, 1);
		}
	}

	/**
	 * Removes and disposes all child components
	 */
	clearChildren(): void {
		this.children.forEach(child => child.dispose());
		this.children = [];
	}

	/**
	 * Disposes this component and all its children
	 */
	dispose(): void {
		this.clearChildren();
		super.dispose();
	}
}
