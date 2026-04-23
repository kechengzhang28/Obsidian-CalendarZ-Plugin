/**
 * Configuration for day display
 * Contains all information needed to render a single day's visual representation
 */
export interface DayDisplayConfig {
	/** Number of notes for this date */
	count: number;
	/** Whether this date is today */
	isToday: boolean;
	/** Whether this date is before today */
	isBeforeToday: boolean;
}

/**
 * Context for display strategy
 * Contains shared data needed across all days in the grid
 */
export interface DisplayContext {
	/** Maximum note count across all days (for normalization) */
	maxCount: number;
	/** Number of notes each dot represents (for dots mode) */
	dotThreshold: number;
	/** Date string in YYYY-MM-DD format */
	dateStr: string;
}

/**
 * Strategy interface for day display modes
 * Implements the Strategy pattern for different visualization modes
 * 
 * This allows easy addition of new display modes without modifying existing code.
 * Each strategy handles its own styling and cleanup.
 * 
 * @example
 * ```typescript
 * // Create a new display mode
 * class BarChartStrategy implements DisplayStrategy {
 *   apply(dayEl, config, context) {
 *     // Render bar chart based on config.count
 *   }
 *   cleanup(dayEl) {
 *     // Remove bar chart elements
 *   }
 * }
 * 
 * // Register the strategy
 * DisplayStrategyFactory.register('barchart', new BarChartStrategy());
 * ```
 */
export interface DisplayStrategy {
	/**
	 * Applies the display mode to a day element
	 * @param dayEl - The day element to style
	 * @param config - Day display configuration containing count and state flags
	 * @param context - Display context with shared data like maxCount
	 */
	apply(dayEl: HTMLElement, config: DayDisplayConfig, context: DisplayContext): void;

	/**
	 * Cleans up any styling applied by this strategy
	 * Removes all elements and classes added by apply()
	 * @param dayEl - The day element to clean
	 */
	cleanup(dayEl: HTMLElement): void;
}

/**
 * Factory for creating display strategies
 * Registers and provides access to display strategy instances
 * 
 * Usage:
 * ```typescript
 * // Register strategies at app startup
 * DisplayStrategyFactory.register('heatmap', new HeatmapStrategy());
 * DisplayStrategyFactory.register('dots', new DotsStrategy());
 * 
 * // Get strategy by name
 * const strategy = DisplayStrategyFactory.get('heatmap');
 * if (strategy) {
 *   strategy.apply(dayEl, config, context);
 * }
 * ```
 */
export class DisplayStrategyFactory {
	private static strategies = new Map<string, DisplayStrategy>();

	/**
	 * Registers a display strategy
	 * @param name - Unique identifier for this strategy
	 * @param strategy - Strategy instance
	 */
	static register(name: string, strategy: DisplayStrategy): void {
		this.strategies.set(name, strategy);
	}

	/**
	 * Gets a registered strategy by name
	 * @param name - Strategy identifier
	 * @returns The strategy instance or undefined if not found
	 */
	static get(name: string): DisplayStrategy | undefined {
		return this.strategies.get(name);
	}

	/**
	 * Checks if a strategy is registered
	 * @param name - Strategy identifier
	 * @returns True if the strategy exists
	 */
	static has(name: string): boolean {
		return this.strategies.has(name);
	}
}
