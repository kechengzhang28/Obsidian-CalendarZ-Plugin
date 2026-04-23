/**
 * Interface for objects that need cleanup
 * Follows the Disposable pattern for resource management
 */
export interface Disposable {
	dispose(): void;
}

/**
 * Manages multiple disposable resources
 * Ensures all resources are properly cleaned up
 */
export class DisposableManager implements Disposable {
	private disposables: Disposable[] = [];

	add(disposable: Disposable): void {
		this.disposables.push(disposable);
	}

	addCallback(callback: () => void): void {
		this.disposables.push({ dispose: callback });
	}

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

	addInterval(id: number): void {
		this.disposables.push({ dispose: () => clearInterval(id) });
	}

	addTimeout(id: number): void {
		this.disposables.push({ dispose: () => clearTimeout(id) });
	}

	dispose(): void {
		this.disposables.forEach(d => d.dispose());
		this.disposables = [];
	}
}
