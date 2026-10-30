import { matchMapCenter, zoneBounds } from "@/scripts/fetchMapData";
import VisGlMapElement from "@/src/match/googleMaps/VisGLMapElement";
import SelectedZonePopup from "@/src/match/components/regions/SelectedZonePopup";
import ZonePolygon from "@/src/match/components/regions/ZonePolygon";
import { useContext, useMemo, useRef, useState } from "react";
import { ZoneData } from "@/scripts/games/connect_four/types";
import { ConnectFourContext, GameContext } from "@/src/match/Board";
import AllTeamMarkers from "@/src/match/googleMaps/AllTeamMarkers";
import { LineData } from "@/scripts/types/googleMaps";
import MyLocationMarker from "@/src/match/googleMaps/MyLocationMarker";
import { isStartZoneClaimable } from "@/src/match/components/regions/region_claim_flow/ClaimFlowModal";
import { Polygon } from "@/src/match/googleMaps/shapes/Polygon";
import TransitOverlay from "@/src/match/components/transit/LazyTransitOverlay";
import { ReviewContext } from "@/src/review/ReviewContext";

const DEBUG = false

export default function ConnectFourMapTab() {
    const { playerData, matchID } = useContext(GameContext)
    // Locations were never logged, so a review has no "you are here"
    const review = useContext(ReviewContext);
    const G = useContext(ConnectFourContext);
    const [currentZone, setCurrentZone] = useState<ZoneData>();
    const [activeLine, setActiveLine] = useState<LineData | undefined>()

    //Render zone polygons
    const { zonePolygons, winningLines } = G.MatchMapData;
    const center = matchMapCenter(G.MatchMapData);
    const transitBounds = useMemo(() => zonePolygons && zoneBounds(zonePolygons, 0.1), [zonePolygons]);

    const maskPaths = useMemo(() => {
        if (!zonePolygons) return [];
        const halfKm = 50;
        const latDelta = halfKm / 111;
        const lngDelta = halfKm / (111 * Math.cos((center.lat * Math.PI) / 180));
        // CCW outer ring so inner rings (zone coords) become holes
        const outerRing = [
            { lat: center.lat + latDelta, lng: center.lng - lngDelta },
            { lat: center.lat - latDelta, lng: center.lng - lngDelta },
            { lat: center.lat - latDelta, lng: center.lng + lngDelta },
            { lat: center.lat + latDelta, lng: center.lng + lngDelta },
        ];
        const holes = zonePolygons.map(zone => [...zone.coords].reverse());
        return [outerRing, ...holes];
    }, [zonePolygons, center.lat, center.lng]);
    const zoneElements = zonePolygons?.map((zone, index) => {
        const onClick = function (
        ) {
            DEBUG && console.log("zone clicked", zone);
            // console.log("highlight zones", highlightedZonesTemp)
            DEBUG && console.log("current zone", currentZone)
            //check if already selected
            if (currentZone?.name === zone.featureName) {
                setCurrentZone(undefined)
                setActiveLine(undefined)
                return;
            }
            setCurrentZone(G.zoneData[index]);
            setActiveLine(winningLines.filter(line => line.matchedPolygons.includes(G.zoneData[index]?.name || ""))[0])
        };
        const zoneDisabled = (zone.featureName === G.startingZone) && (!isStartZoneClaimable(G.zoneData))
        return (
            <ZonePolygon
                zone={zone}
                handleZoneClick={onClick}
                currentZone={currentZone}
                zoneGameData={G.zoneData[index]}
                key={index}
                activeLine={activeLine}
                disabled={zoneDisabled}
            />
        );
    });
    return (
        <>
            <div id="map" style={mapStyles}>
                <SelectedZonePopup currentZone={currentZone} setCurrentZone={setCurrentZone} activeLine={activeLine} setActiveLine={setActiveLine} />
                <VisGlMapElement
                    center={center}
                    onClick={() => {
                        console.log("map clicked!")
                        setCurrentZone(undefined);
                        setActiveLine(undefined);
                    }}
                >
                    <Polygon
                        paths={maskPaths}
                        fillColor="#000000"
                        fillOpacity={0.35}
                        strokeWeight={0}
                        clickable={false}
                        zIndex={-1}
                    />
                    <>{zoneElements}</>
                    <TransitOverlay bounds={transitBounds} />
                    {review ? null : <MyLocationMarker color={playerData.data.teamColor} defaultLocation={center} matchID={matchID} playerID={playerData.data.playerID} broadcast={true} />}
                    <AllTeamMarkers teamName={playerData.data.teamColor} />
                </VisGlMapElement>
            </div>
        </>
    )
}
const mapStyles: React.CSSProperties = {
    flexGrow: 10,
    position: "relative",
    userSelect: "none",
};


