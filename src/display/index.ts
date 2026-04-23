export * from "./DisplayStrategy";
export * from "./HeatmapStrategy";
export * from "./DotsStrategy";

import { DisplayStrategyFactory } from "./DisplayStrategy";
import { HeatmapStrategy } from "./HeatmapStrategy";
import { DotsStrategy } from "./DotsStrategy";

// Register default strategies
DisplayStrategyFactory.register("heatmap", new HeatmapStrategy());
DisplayStrategyFactory.register("dots", new DotsStrategy());
