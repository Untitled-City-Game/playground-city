import { MatchTeamColor } from "@/scripts/types/types";
import { GameContext } from "@/src/match/Board";
import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { useContext, useEffect, useState } from "react";
import { IoLocationSharp } from "react-icons/io5";
import { Circle } from "@/src/match/googleMaps/shapes/Circle";
import { FaQuestionCircle } from "react-icons/fa";
import { useMantineTheme } from "@mantine/core";
import Span from "@/src/userInterface/Span";
import { ACCURACY_MAX } from "@/scripts/consts";
import P from "@/src/userInterface/P";
import useEase from "@/scripts/ease";
import TeamAvatar from "@/src/userInterface/TeamAvatar";

const iconSize = 30
// Minimum on-screen radius of the accuracy circle.
const MIN_ACCURACY_RADIUS_PX = 8.4

// Web Mercator ground resolution: metres covered by one screen pixel.
function pixelsToMeters(pixels: number, lat: number, zoom: number) {
    return pixels * 156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, zoom);
}

function useMapZoom() {
    const map = useMap();
    const [zoom, setZoom] = useState<number | undefined>(map?.getZoom());
    useEffect(() => {
        if (!map) return;
        setZoom(map.getZoom());
        const listener = map.addListener("zoom_changed", () => setZoom(map.getZoom()));
        return () => listener.remove();
    }, [map]);
    return zoom;
}

export default function LocationMarker({ position, accuracy, color, invalid, expired }:
    {
        position: google.maps.LatLngLiteral,
        accuracy?: number,
        color: MatchTeamColor,
        invalid?: boolean,
        expired?: boolean

    }) {
    const { G: gameData } = useContext(GameContext)
    const theme = useMantineTheme();
    const accurate = ((accuracy ?? ACCURACY_MAX) < ACCURACY_MAX) && !invalid
    //update my location with location server
    const teamImgStyle: React.CSSProperties = {
        height: `${iconSize}px`,
        width: `${iconSize}px`,
        objectFit: "cover",
        borderRadius: "50%",
        position: "absolute",
        bottom: `${iconSize * 0.75}px`,
        left: `${-iconSize / 2}px`,
        zIndex: "3",
    }
    const filteredAccuracy = accuracy ? accuracy > ACCURACY_MAX ? 0 : accuracy : 0;
    const positionEased = { lat: useEase(position.lat, 200, 13), lng: useEase(position.lng, 200, 13) }
    const zoom = useMapZoom();
    const minRadius = zoom === undefined ? 0 : pixelsToMeters(MIN_ACCURACY_RADIUS_PX, positionEased.lat, zoom);
    // Clamp after easing so the minimum tracks zoom immediately.
    const accuracyRadius = Math.max(useEase(filteredAccuracy, 200), minRadius);
    return (
        <AdvancedMarker position={positionEased}>
            {/* <P fz="xs">accurate: {accurate ? 'true' : 'false'}</P>
			<P fz="xs">expired: {expired ? 'true' : 'false'}</P>
			<P fz="xs">invalid: {invalid ? 'true' : 'false'}</P> */}
            <IoLocationSharp
                fill={accurate ? theme.colors[color][6] : theme.colors[color][9]}
                stroke="white"
                strokeWidth={10}
                strokeOpacity={1}
                size={`${iconSize * 2}px`}
                style={{
                    position: "absolute",
                    bottom: "0px",
                    left: `${-iconSize}px`,
                    zIndex: "2",
                }}
            />

            <TeamAvatar color={color} photoURL={gameData.teamPhotoURLs[color]} style={teamImgStyle} />
            {accurate ? <Circle
                center={positionEased}
                radius={accuracyRadius}
                strokeColor={color}
                fillColor={color}
                strokeOpacity={0.3}
                fillOpacity={0.1}
                clickable={false}
            /> : <FaQuestionCircle className="location-missing" size="4rem" opacity={0.3} style={{ transform: "translate(-50%, 50%)", zIndex: "0" }} />}
        </AdvancedMarker>
    )
}
