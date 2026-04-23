/**
 * Configuration for day display
 */
export interface DayDisplayConfig {
	count: number;
	isToday: boolean;
	isBeforeToday: boolean;
}

/**
 * Context for display strategy
 */
export interface DisplayContext {
	maxCount: number;
	dotThreshold: number;
	dateStr: string;
}

/**
 * Strategy interface for day display modes
 * Implements the Strategy pattern for different visualization modes
 */
export interface DisplayStrategy {
	/**
	 * Applies the display mode to a day element
	 * @param dayEl - The day element to style
	 * @param config - Day display configuration
	 * @param context - Display context with shared data
	 */
	apply(dayEl: HTMLElement, config: DayDisplayConfig, context: DisplayContext): void;

	/**
	 * Cleans up any styling applied by this strategy
	 * @param dayEl - The day element to clean
	 */
	cleanup(dayEl: HTMLElement): void;
}

/**
 * Factory for creating display strategies
 */
export class DisplayStrategyFactory {
	private static strategies = new Map<string, DisplayStrategy>();

	static register(name: string, strategy: DisplayStrategy): void {
		this.strategies.set(name, strategy);
	}

	static get(name: string): DisplayStrategy | undefined {
		return this.strategies.get(name);
	}

	static has(name: string): boolean {
		return this.strategies.has(name);
	}
}
