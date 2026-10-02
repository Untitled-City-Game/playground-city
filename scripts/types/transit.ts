// Public transport line overlay data, built by the game server from OpenStreetMap
// (see server/transit.ts) and drawn by src/match/components/transit/.

// Ordered from most to least prominent: when a stretch of track or road is
// shared by several modes, it's drawn as the first one in this list.
export const transitModes = ["train", "subway", "light_rail", "tram", "bus"] as const;
export type TransitMode = typeof transitModes[number];

export type Bounds = {
	south: number,
	west: number,
	north: number,
	east: number
};

export type TransitLineProperties = {
	kind: "line",
	mode: TransitMode,
	// Line colour from OSM, when every route of this mode on the segment agrees
	colour?: string,
	// Route numbers/names that run along this segment
	refs: string[]
};

// Stations aren't included: the base map already shows them, and they're
// clickable there.
export type TransitFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.LineString, TransitLineProperties>;

// Largest bbox side (degrees) the server will fetch transit for
export const maxTransitBoundsSpan = 0.5;

export function boundsToQuery({ south, west, north, east }: Bounds): string {
	return [south, west, north, east].map(n => n.toFixed(4)).join(",");
}
