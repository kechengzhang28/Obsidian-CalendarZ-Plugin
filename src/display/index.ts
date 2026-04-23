/**
 * Display strategies for calendar day visualization
 * 
 * This module implements the Strategy pattern for different ways to display
 * note counts on calendar days. Currently supports:
 * - Heatmap: Opacity-based background coloring
 * - Dots: Visual dots representing note counts
 * 
 * To add a new display mode:
 * 1. Create a new class implementing DisplayStrategy
 * 2. Register it with DisplayStrategyFactory.register()
 * 3. Add the mode name to the DisplayMode type
 */

export * from "./DisplayStrategy";
export * from "./HeatmapStrategy";
export * from "./DotsStrategy";

import { DisplayStrategyFactory } from "./DisplayStrategy";
import { HeatmapStrategy } from "./HeatmapStrategy";
import { DotsStrategy } from "./DotsStrategy";

// Register default strategies
DisplayStrategyFactory.register("heatmap", new HeatmapStrategy());
DisplayStrategyFactory.register("dots", new DotsStrategy());
