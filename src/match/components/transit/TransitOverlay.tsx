import { Bounds, TransitFeatureCollection, TransitMode, transitModes } from "@/scripts/types/transit";
import { ZoomContext } from "@/src/match/googleMaps/VisGLMapElement";
import useTransitData from "@/src/match/components/transit/useTransitData";
import { anyLayerEnabled, isModeEnabled, useTransitLayers } from "@/src/match/components/transit/transitLayerSettings";
import type { Color } from "@deck.gl/core";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";
import { PathLayer } from "@deck.gl/layers";
import { ControlPosition, MapControl, useMap } from "@vis.gl/react-google-maps";
import { useContext, useEffect, useMemo, useState } from "react";

// Fallback colours for lines with no colour in OSM
const modeColours: Record<TransitMode, string> = {
	train: "#1c4fa3",
	subway: "#7a2fa3",
	light_rail: "#0b8a6f",
	tram: "#2b8a3e",
	bus: "#5c6670",
};

// 40% transparent, so zones and the base map show through
const LINE_ALPHA = 153;

// Pixels
const lineWidths: Record<TransitMode, number> = {
	train: 2,
	subway: 4,
	light_rail: 3,
	tram: 3,
	bus: 1.5,
};

// Least zoom at which each mode's lines are drawn, to keep the zoomed-out
// map readable in bus-heavy cities.
const lineMinZoom: Record<TransitMode, number> = {
	train: 0, subway: 0, light_rail: 0, tram: 0, bus: 13,
};

type TransitLine = { path: [number, number][], mode: TransitMode, colour: Color };

/**
 * Public transport lines from OpenStreetMap, drawn on the GPU by deck.gl
 * (interleaved with the vector map). Stations come from the base map itself.
 * Must be inside a VisGlMapElement.
 */
export default function TransitOverlay({ bounds }: { bounds: Bounds | undefined }) {
	const map = useMap();
	const transit = useTransitData(bounds);
	const [overlay, setOverlay] = useState<GoogleMapsOverlay>();

	// The map's zoom changes many times a second while zooming (it's
	// fractional on vector maps), but what's drawn only changes when a mode
	// crosses its min zoom — key everything below off the whole-number zoom.
	const zoomLevel = Math.floor(useContext(ZoomContext));

	const lines = useMemo(() => toDrawable(transit), [transit]);
	const layers = useTransitLayers();
	const visibleLines = useMemo(
		() => lines.filter(line => zoomLevel >= lineMinZoom[line.mode] && isModeEnabled(line.mode, layers)),
		[lines, zoomLevel, layers]
	);

	useEffect(() => {
		if (!map) return;
		const deckOverlay = new GoogleMapsOverlay({ interleaved: true });
		deckOverlay.setMap(map);
		setOverlay(deckOverlay);
		return () => {
			deckOverlay.setMap(null);
			deckOverlay.finalize();
			setOverlay(undefined);
		};
	}, [map]);

	useEffect(() => {
		overlay?.setProps({
			layers: [
				new PathLayer<TransitLine>({
					id: "transit-lines",
					data: visibleLines,
					getPath: line => line.path,
					getColor: line => line.colour,
					getWidth: line => lineWidths[line.mode],
					widthUnits: "pixels",
					capRounded: true,
					jointRounded: true,
				}),
			],
		});
	}, [overlay, visibleLines]);

	// Credit OSM only while some of its data is switched on
	if (!transit || !anyLayerEnabled(layers)) return null;
	return (
		<>
			<MapControl position={ControlPosition.LEFT_BOTTOM}>
				<div style={attributionStyle}>
					Transit © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors
				</div>
			</MapControl>
		</>
	);
}

function toDrawable(transit: TransitFeatureCollection | undefined): TransitLine[] {
	const lines: TransitLine[] = [];
	for (const feature of transit?.features ?? []) {
		// Responses cached from before stations were dropped can still contain them
		if (feature.properties.kind !== "line" || feature.geometry.type !== "LineString") continue;
		const colour = cssToColour(feature.properties.colour) ?? hexToColour(modeColours[feature.properties.mode]);
		lines.push({
			path: feature.geometry.coordinates as [number, number][],
			mode: feature.properties.mode,
			colour: [...colour, LINE_ALPHA],
		});
	}
	// Later items draw on top: buses at the bottom, trains on top
	const rank = (mode: TransitMode) => -transitModes.indexOf(mode);
	return lines.sort((a, b) => rank(a.mode) - rank(b.mode));
}

function hexToColour(hex: string): [number, number, number] {
	const value = hex.length === 4
		? hex.slice(1).split("").map(c => c + c).join("")
		: hex.slice(1, 7);
	const n = parseInt(value, 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// OSM colours are hex or CSS colour names; let the browser normalise names.
const colourCache = new Map<string, [number, number, number] | undefined>();
function cssToColour(colour: string | undefined): [number, number, number] | undefined {
	if (!colour) return undefined;
	if (colour.startsWith("#")) return hexToColour(colour);
	if (!colourCache.has(colour)) {
		const context = document.createElement("canvas").getContext("2d");
		if (!context) return undefined;
		context.fillStyle = "#000001";
		context.fillStyle = colour;
		// An unknown name leaves fillStyle unchanged
		colourCache.set(colour, context.fillStyle === "#000001" ? undefined : hexToColour(context.fillStyle));
	}
	return colourCache.get(colour);
}

const attributionStyle: React.CSSProperties = {
	fontSize: "10px",
	background: "rgba(255, 255, 255, 0.7)",
	color: "#333",
	padding: "0 4px",
};
