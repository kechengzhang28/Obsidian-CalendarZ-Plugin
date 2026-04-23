import { Disposable, DisposableManager } from "./Disposable";

/**
 * Base class for UI components
 * Provides lifecycle management and disposable resource handling
 */
export abstract class Component implements Disposable {
	protected disposables = new DisposableManager();
	protected container: HTMLElement | null = null;
	protected isRendered = false;

	/**
	 * Renders the component into the given container
	 * @param container - Parent element to render into
	 */
	abstract render(container: HTMLElement): void;

	/**
	 * Updates the component with new data/state
	 * Override in subclasses for dynamic updates
	 */
	update(): void {
		// Default: no-op, override in subclasses
	}

	/**
	 * Destroys the component and cleans up resources
	 */
	dispose(): void {
		this.disposables.dispose();
		this.container = null;
		this.isRendered = false;
	}

	/**
	 * Gets the component's container element
	 */
	getContainer(): HTMLElement | null {
		return this.container;
	}

	/**
	 * Checks if the component has been rendered
	 */
	getIsRendered(): boolean {
		return this.isRendered;
	}
}

/**
 * Base class for container components that manage child components
 */
export abstract class ContainerComponent extends Component {
	protected children: Component[] = [];

	addChild(child: Component): void {
		this.children.push(child);
	}

	removeChild(child: Component): void {
		const index = this.children.indexOf(child);
		if (index !== -1) {
			child.dispose();
			this.children.splice(index, 1);
		}
	}

	clearChildren(): void {
		this.children.forEach(child => child.dispose());
		this.children = [];
	}

	dispose(): void {
		this.clearChildren();
		super.dispose();
	}
}
