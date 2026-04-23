/**
 * Interface for objects that need cleanup
 * Follows the Disposable pattern for resource management
 */
export interface Disposable {
	/**
	 * Cleans up resources held by the object
	 * Should be called when the object is no longer needed
	 */
	dispose(): void;
}

/**
 * Manages multiple disposable resources
 * Ensures all resources are properly cleaned up
 * 
 * Usage:
 * ```typescript
 * const manager = new DisposableManager();
 * manager.addEventListener(element, 'click', handler);
 * manager.addInterval(setInterval(() => {}, 1000));
 * // Later...
 * manager.dispose(); // All resources cleaned up
 * ```
 */
export class DisposableManager implements Disposable {
	private disposables: Disposable[] = [];

	/**
	 * Adds a disposable resource to be managed
	 * @param disposable - Resource that can be disposed
	 */
	add(disposable: Disposable): void {
		this.disposables.push(disposable);
	}

	/**
	 * Adds a callback function as a disposable resource
	 * @param callback - Function to call on disposal
	 */
	addCallback(callback: () => void): void {
		this.disposables.push({ dispose: callback });
	}

	/**
	 * Adds a DOM event listener and automatically removes it on disposal
	 * @param element - Target element
	 * @param event - Event name
	 * @param listener - Event handler
	 */
	addDomEvent(
		element: EventTarget,
		event: string,
		listener: EventListenerOrEventListenerObject
	): void {
		element.addEventListener(event, listener);
		this.disposables.push({
			dispose: () => element.removeEventListener(event, listener),
		});
	}

	/**
	 * Adds a setInterval timer and automatically clears it on disposal
	 * @param id - Interval ID returned by setInterval
	 */
	addInterval(id: number): void {
		this.disposables.push({ dispose: () => clearInterval(id) });
	}

	/**
	 * Adds a setTimeout timer and automatically clears it on disposal
	 * @param id - Timeout ID returned by setTimeout
	 */
	addTimeout(id: number): void {
		this.disposables.push({ dispose: () => clearTimeout(id) });
	}

	/**
	 * Disposes all managed resources
	 * Clears the internal list after disposal
	 */
	dispose(): void {
		this.disposables.forEach(d => d.dispose());
		this.disposables = [];
	}
}
