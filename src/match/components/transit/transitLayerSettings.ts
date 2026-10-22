import { TransitMode } from "@/scripts/types/transit";
import { useSyncExternalStore } from "react";

// Which transit lines this player wants on the map. A per-device viewing
// preference — shared between the status bar's layers modal and the map, which
// sit in different parts of the tree, and remembered across reloads.

export type TransitLayerSettings = {
	train: boolean,
	metro: boolean,
	tram: boolean,
	bus: boolean
};

const STORAGE_KEY = "transitLayers";
const defaults: TransitLayerSettings = { train: true, metro: true, tram: true, bus: true };

let settings = load();
const listeners = new Set<() => void>();

function load(): TransitLayerSettings {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
	} catch {
		return defaults;
	}
}

export function setTransitLayer(layer: keyof TransitLayerSettings, visible: boolean) {
	settings = { ...settings, [layer]: visible };
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
	} catch {
		// Not remembered, but still applies for this session
	}
	listeners.forEach(listener => listener());
}

export function useTransitLayers(): TransitLayerSettings {
	return useSyncExternalStore(
		listener => {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		() => settings
	);
}

// Which checkbox controls each mode — light rail shares one with trams
const modeLayer: Record<TransitMode, keyof TransitLayerSettings> = {
	train: "train",
	subway: "metro",
	light_rail: "tram",
	tram: "tram",
	bus: "bus",
};

export function isModeEnabled(mode: TransitMode, layers: TransitLayerSettings): boolean {
	return layers[modeLayer[mode]];
}

export function anyLayerEnabled(layers: TransitLayerSettings): boolean {
	return Object.values(layers).some(Boolean);
}
