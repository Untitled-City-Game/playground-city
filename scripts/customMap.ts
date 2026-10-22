// Helpers for player-supplied Google My Maps maps.
//
// A My Maps map is identified by its `mid` — the id that appears in every share
// link, e.g.
//   https://www.google.com/maps/d/edit?mid=1h1mLlEU1PRRbiF9eusZUplFhg7wjCaU&usp=sharing
//   https://www.google.com/maps/d/u/0/viewer?mid=1h1mLlEU1PRRbiF9eusZUplFhg7wjCaU
// That id is exactly what the built-in cities store as `kml_live_id`, so once we
// have it a custom map loads through the same KML pipeline as everything else.

// Conservative: My Maps ids are base64url-ish. Keeping this tight also stops a
// pasted id from smuggling path or query segments into the KML URL we build.
const MAP_ID_PATTERN = /^[A-Za-z0-9_-]{10,128}$/;

export function isValidCustomMapId(mapId: string): boolean {
	return MAP_ID_PATTERN.test(mapId);
}

/**
 * Pull the map id out of a Google My Maps link (or accept a bare id that was
 * pasted on its own). Returns undefined if nothing usable is in there.
 */
export function parseCustomMapId(input: string): string | undefined {
	const trimmed = input.trim();
	if (!trimmed) return undefined;

	// A bare id pasted without the surrounding URL.
	if (isValidCustomMapId(trimmed) && !trimmed.includes("/")) return trimmed;

	// Otherwise pull `mid` out of the query string. Matching by hand rather than
	// with `new URL()` so a link pasted without its scheme still works.
	const mid = trimmed.match(/[?&]mid=([^&#\s]+)/)?.[1];
	if (!mid) return undefined;

	const decoded = safeDecode(mid);
	return isValidCustomMapId(decoded) ? decoded : undefined;
}

function safeDecode(value: string): string {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

export const CUSTOM_MAP_HELP =
	"Open your map in Google My Maps, choose Share, make it visible to anyone with the link, then paste that link here.";
