import { CUSTOM_CITY, gameLocationCenters, maps } from "@/scripts/consts";
import { isValidCustomMapId } from "@/scripts/customMap";
import makeLines, { assignPolygons } from "@/scripts/geojson/makeLines";
import makePolygons from "@/scripts/geojson/makePolygons";
import * as toGeoJson from "@tmcw/togeojson";
import { DOMParser } from "xmldom";
import { City, CityOrCustom, MatchMapData } from "./types/types";
import { LineData, PolyData } from "@/scripts/types/googleMaps";

export async function fetchMapData(cityName: CityOrCustom = "london", customMapId?: string) : Promise<MatchMapData> {
  console.log("fetch map data")
  const mapId = resolveMapId(cityName, customMapId);
  const { geoJson, title } = await fetchKML(mapId);

  //Process data and assign lines to zones
  let zoneLines: LineData[] = makeLines(geoJson);
  const zonePolygons: PolyData[] = makePolygons(geoJson, zoneLines);
  zoneLines = assignPolygons(zoneLines, zonePolygons);

  if (cityName === CUSTOM_CITY && zonePolygons.length === 0) {
    throw new Error("That map has no neighbourhoods on it. Draw at least one shape in Google My Maps and try again.");
  }

  return {
    zonePolygons: zonePolygons,
    winningLines: zoneLines,
    city: cityName,
    mapName: cityName === CUSTOM_CITY ? title : maps[cityName].name,
    customMapId: cityName === CUSTOM_CITY ? mapId : undefined,
    center: cityName === CUSTOM_CITY ? boundsCenter(zonePolygons) : gameLocationCenters[cityName],
  };
}

/**
 * Centre of the camera for a match. Falls back to the built-in city centre for
 * matches created before maps carried their own centre.
 */
export function matchMapCenter(mapData: Pick<MatchMapData, "city" | "center">): google.maps.LatLngLiteral {
  if (mapData.center) return mapData.center;
  if (mapData.city !== CUSTOM_CITY) return gameLocationCenters[mapData.city as City];
  return { lat: 0, lng: 0 };
}

function resolveMapId(cityName: CityOrCustom, customMapId?: string): string {
  if (cityName !== CUSTOM_CITY) return maps[cityName].kml_live_id;
  if (!customMapId || !isValidCustomMapId(customMapId)) {
    throw new Error("That doesn't look like a Google My Maps link.");
  }
  return customMapId;
}

// Midpoint of the bounding box of every zone. Deliberately not using
// findPolygonCenter: this runs during match setup, where the Google Maps JS API
// isn't guaranteed to have loaded yet.
function boundsCenter(zonePolygons: PolyData[]): google.maps.LatLngLiteral {
  const coords = zonePolygons.flatMap(zone => zone.coords);
  if (coords.length === 0) return { lat: 0, lng: 0 };
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const { lat, lng } of coords) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }
  return { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 };
}

async function fetchKML(mapId: string){
  console.log("fetch kml")
  try {
    console.log(process.env.GAME_SERVER + `/map-data/${mapId}`)
    const res = await fetch(process.env.GAME_SERVER + `/map-data/${mapId}`);
    if (!res.ok) {
      throw new Error(`Map server returned ${res.status} ${res.statusText}. Check the map is shared with "anyone with the link".`);
    }
    const kmlText = await res.text();
    const kmlParsed = new DOMParser().parseFromString(kmlText, "text/xml");
    const geoJson = toGeoJson.kml(kmlParsed);
    if(!geoJson.features){
      throw new Error("KML file did not contain features");
    }
    return { geoJson: geoJson as GeoJSON.FeatureCollection, title: kmlTitle(kmlParsed) };
    }
    catch (error) {
      console.error("Error fetching KML", error);
      throw error instanceof Error ? error : new Error(`Error fetching KML: ${error}`);
    }
}

// The map's own title, as shown in My Maps — the first <name> under <Document>.
function kmlTitle(kml: Document): string | undefined {
  const documentNode = kml.getElementsByTagName("Document")[0];
  if (!documentNode) return undefined;
  for (let i = 0; i < documentNode.childNodes.length; i++) {
    const child = documentNode.childNodes[i] as Element;
    if (child.nodeName === "name") return child.textContent?.trim() || undefined;
  }
  return undefined;
}
