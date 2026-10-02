import { promises as fs } from 'fs';
import path from 'path';
import * as turf from '@turf/turf';
import {
    Bounds,
    boundsToQuery,
    maxTransitBoundsSpan,
    TransitFeatureCollection,
    TransitLineProperties,
    TransitMode,
    transitModes
} from '@scripts/types/transit';

// Public transport lines from OpenStreetMap, via the Overpass API.
// Overpass is slow (10s+ for a city centre) and rate limited, so results are
// cached in memory and on disk, keyed by bounding box.

const OVERPASS_URL = process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter';
const CACHE_DIR = path.join(process.cwd(), 'server/cache/transit');
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
const OVERPASS_RETRIES = 2;
// ~5m. Enough to drop most of the points on a curve without visibly moving it.
const SIMPLIFY_TOLERANCE = 0.00005;
// Bump when the response shape changes, so old disk cache entries are ignored
const CACHE_VERSION = 3;

type OverpassTags = Record<string, string>;
type OverpassElement =
    | { type: 'relation', id: number, tags?: OverpassTags, members: { type: string, ref: number, role: string }[] }
    | { type: 'way', id: number, tags?: OverpassTags, geometry?: ({ lat: number, lon: number } | null)[] };

// Track that trains actually run on. Route relations also list platforms,
// stations and planned/abandoned track, which shouldn't be drawn as lines.
const OPERATING_RAILWAYS = new Set(['rail', 'subway', 'light_rail', 'tram', 'narrow_gauge', 'monorail', 'funicular']);
// OSM lifecycle states, used as a value (`highway=construction`) or a key
// prefix (`disused:railway=rail`). A bare `construction=*` key is not one of
// these: it marks works on a road that's still open.
const LIFECYCLE = '(proposed|planned|construction|disused|abandoned|razed|demolished|removed)';
const NOT_OPERATING_VALUE = new RegExp(`^${LIFECYCLE}$`);
const NOT_OPERATING_KEY = new RegExp(`^${LIFECYCLE}:`);

const memoryCache = new Map<string, { time: number, data: TransitFeatureCollection }>();
const inFlight = new Map<string, Promise<TransitFeatureCollection>>();

/**
 * Parse and validate a `south,west,north,east` bbox string. Returns undefined
 * for anything malformed or larger than maxTransitBoundsSpan on either side.
 */
export function parseBounds(bbox: unknown): Bounds | undefined {
    if (typeof bbox !== 'string') return undefined;
    const parts = bbox.split(',').map(Number);
    if (parts.length !== 4 || !parts.every(Number.isFinite)) return undefined;
    const [south, west, north, east] = parts;
    if (south >= north || west >= east) return undefined;
    if (south < -90 || north > 90 || west < -180 || east > 180) return undefined;
    if (north - south > maxTransitBoundsSpan || east - west > maxTransitBoundsSpan) return undefined;
    return { south, west, north, east };
}

export async function getTransit(bounds: Bounds): Promise<TransitFeatureCollection> {
    const key = cacheKey(bounds);
    const cached = memoryCache.get(key) ?? await readDiskCache(key);
    if (cached && Date.now() - cached.time < CACHE_TTL) {
        memoryCache.set(key, cached);
        return cached.data;
    }
    // Several players open the map at once — share one Overpass request.
    let request = inFlight.get(key);
    if (!request) {
        request = fetchTransit(bounds).then(async (data) => {
            const entry = { time: Date.now(), data };
            memoryCache.set(key, entry);
            await writeDiskCache(key, entry);
            return data;
        }).finally(() => inFlight.delete(key));
        inFlight.set(key, request);
    }
    return request;
}

function cacheKey(bounds: Bounds): string {
    const { south, west, north, east } = bounds;
    return [`v${CACHE_VERSION}`, ...[south, west, north, east].map(n => n.toFixed(3))].join('_');
}

async function readDiskCache(key: string) {
    try {
        const text = await fs.readFile(path.join(CACHE_DIR, `${key}.json`), 'utf8');
        return JSON.parse(text) as { time: number, data: TransitFeatureCollection };
    } catch {
        return undefined;
    }
}

async function writeDiskCache(key: string, entry: { time: number, data: TransitFeatureCollection }) {
    try {
        await fs.mkdir(CACHE_DIR, { recursive: true });
        await fs.writeFile(path.join(CACHE_DIR, `${key}.json`), JSON.stringify(entry));
    } catch (error) {
        console.error('Failed to write transit cache', error);
    }
}

async function fetchTransit(bounds: Bounds): Promise<TransitFeatureCollection> {
    const bbox = boundsToQuery(bounds);
    // Route relations give us each way's mode/colour/ref; the ways' geometry is
    // fetched once each (clipped to the bbox) rather than per route, since bus
    // routes share most of their roads.
    const query = `[out:json][timeout:120];
rel["type"="route"]["route"~"^(train|subway|light_rail|monorail|tram|bus|trolleybus)$"](${bbox})->.r;
.r out body;
way(r.r)(${bbox});
out geom(${bbox});`;
    console.log('fetching transit from overpass for', bbox);
    for (let attempt = 0; ; attempt++) {
        const response = await fetch(OVERPASS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'PlaygroundCity/1.0 (transit map overlay)'
            },
            body: new URLSearchParams({ data: query }),
        });
        // The public Overpass instance only allows a couple of requests at a
        // time per IP and answers 429/504 when busy — back off and retry.
        if ((response.status === 429 || response.status === 504) && attempt < OVERPASS_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, 10_000 * (attempt + 1)));
            continue;
        }
        if (!response.ok) {
            throw new Error(`Overpass returned ${response.status} ${response.statusText}`);
        }
        const json = await response.json() as { elements: OverpassElement[] };
        return overpassToTransit(json.elements);
    }
}

export function overpassToTransit(elements: OverpassElement[]): TransitFeatureCollection {
    // Every route that uses each way
    const routesByWay = new Map<number, { mode: TransitMode, colour?: string, ref?: string }[]>();
    for (const element of elements) {
        if (element.type !== 'relation') continue;
        const mode = routeMode(element.tags?.route);
        if (!mode) continue;
        const route = {
            mode,
            colour: element.tags?.colour,
            ref: element.tags?.ref || element.tags?.name,
        };
        for (const member of element.members) {
            if (member.type !== 'way') continue;
            const routes = routesByWay.get(member.ref) ?? [];
            routes.push(route);
            routesByWay.set(member.ref, routes);
        }
    }

    const lines: GeoJSON.Feature<GeoJSON.LineString, TransitLineProperties>[] = [];
    for (const element of elements) {
        if (element.type === 'way' && element.geometry && routesByWay.has(element.id) && isOperating(element.tags)) {
            lines.push(...wayToLines(element.geometry, routesByWay.get(element.id)!));
        }
    }
    return { type: 'FeatureCollection', features: lines };
}

function wayToLines(
    geometry: ({ lat: number, lon: number } | null)[],
    routes: { mode: TransitMode, colour?: string, ref?: string }[]
): GeoJSON.Feature<GeoJSON.LineString, TransitLineProperties>[] {
    const mode = transitModes.find(m => routes.some(route => route.mode === m))!;
    const sameMode = routes.filter(route => route.mode === mode);
    const colours = new Set(sameMode.map(route => route.colour?.toLowerCase()));
    const colour = colours.size === 1 ? [...colours][0] : undefined;
    const refs = [...new Set(sameMode.flatMap(route => route.ref ? [route.ref] : []))].sort();

    // Clipping to the bbox leaves nulls where the way leaves and re-enters it,
    // splitting it into separate runs.
    const runs: [number, number][][] = [[]];
    for (const point of geometry) {
        if (point) runs[runs.length - 1].push([point.lon, point.lat]);
        else if (runs[runs.length - 1].length) runs.push([]);
    }
    return runs.filter(run => run.length >= 2).map(run => {
        const simplified = turf.simplify(turf.lineString(run), { tolerance: SIMPLIFY_TOLERANCE });
        return {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: simplified.geometry.coordinates.map(([lng, lat]) => [round(lng), round(lat)]),
            },
            properties: { kind: 'line', mode, colour: isColour(colour) ? colour : undefined, refs },
        };
    });
}

function routeMode(route: string | undefined): TransitMode | undefined {
    switch (route) {
        case 'train': return 'train';
        case 'subway': return 'subway';
        case 'light_rail':
        case 'monorail': return 'light_rail';
        case 'tram': return 'tram';
        case 'bus':
        case 'trolleybus': return 'bus';
        default: return undefined;
    }
}

function isOperating(tags: OverpassTags | undefined): boolean {
    if (!tags) return true;
    if (tags.railway) return OPERATING_RAILWAYS.has(tags.railway);
    if (tags.public_transport === 'platform' || tags.highway === 'platform') return false;
    if (tags.highway && NOT_OPERATING_VALUE.test(tags.highway)) return false;
    // Bus routes run on roads, which have no railway tag; anything left with
    // a lifecycle-prefixed key is track or road that isn't in use.
    return !Object.keys(tags).some(key => NOT_OPERATING_KEY.test(key));
}

function isColour(colour: string | undefined): colour is string {
    // OSM colours are mostly hex, sometimes CSS names — reject anything that
    // isn't a plain word or hex code before it reaches the map styling.
    return !!colour && /^(#[0-9a-f]{3}|#[0-9a-f]{6}|[a-z]+)$/i.test(colour);
}

function round(n: number): number {
    return Math.round(n * 1e5) / 1e5;
}
