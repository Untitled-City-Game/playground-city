import { MatchTeamColor } from "@/scripts/types/types";
import { GameContext } from "@/src/match/Board";
import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { useContext, useEffect, useRef, useState } from "react";
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

// Drags a marker with plain pointer events rather than Google's own marker
// dragging, which draws a cross at the anchor point. Returns where to show the
// marker (following the pointer mid-drag) and props for its content.
//
// The listeners are attached to the element directly, not through React:
// React handles events at the page root, after the map has already seen the
// press and started panning.
function useMarkerDrag(
    position: google.maps.LatLngLiteral,
    onDragEnd: ((position: google.maps.LatLngLiteral) => void) | undefined,
) {
    const map = useMap();
    const [element, setElement] = useState<HTMLDivElement | null>(null);
    const [dragPosition, setDragPosition] = useState<google.maps.LatLngLiteral>();
    // Latest values for the listeners, which are only attached once
    const latest = useRef({ position, onDragEnd });
    latest.current = { position, onDragEnd };
    const draggable = !!onDragEnd;

    useEffect(() => {
        if (!map || !element || !draggable) return;
        // Pixel conversions need a projection, which only overlays get
        const overlay = new google.maps.OverlayView();
        overlay.onAdd = () => {};
        overlay.draw = () => {};
        overlay.onRemove = () => {};
        overlay.setMap(map);

        let dragging: { pointerId: number, offsetX: number, offsetY: number, savedGestures: string } | undefined;
        let current: google.maps.LatLngLiteral | undefined;

        function pixel(event: PointerEvent) {
            const rect = map!.getDiv().getBoundingClientRect();
            return { x: event.clientX - rect.left, y: event.clientY - rect.top };
        }
        // Keep presses on the pin away from the map, so it doesn't pan
        function stop(event: Event) {
            event.stopPropagation();
        }
        function onPointerDown(event: PointerEvent) {
            event.stopPropagation();
            const projection = overlay.getProjection();
            if (!projection || dragging) return;
            const anchor = projection.fromLatLngToContainerPixel(latest.current.position);
            const pointer = pixel(event);
            dragging = {
                pointerId: event.pointerId,
                // Where on the pin it was grabbed, so it doesn't jump to the pointer
                offsetX: anchor ? pointer.x - anchor.x : 0,
                offsetY: anchor ? pointer.y - anchor.y : 0,
                savedGestures: map!.get("gestureHandling") ?? "auto",
            };
            current = latest.current.position;
            element!.setPointerCapture(event.pointerId);
            map!.setOptions({ gestureHandling: "none" });
            setDragPosition(current);
        }
        function onPointerMove(event: PointerEvent) {
            if (!dragging || event.pointerId !== dragging.pointerId) return;
            const projection = overlay.getProjection();
            const pointer = pixel(event);
            const latLng = projection?.fromContainerPixelToLatLng(
                new google.maps.Point(pointer.x - dragging.offsetX, pointer.y - dragging.offsetY)
            );
            if (!latLng) return;
            current = latLng.toJSON();
            setDragPosition(current);
        }
        function onPointerUp(event: PointerEvent) {
            if (!dragging || event.pointerId !== dragging.pointerId) return;
            map!.setOptions({ gestureHandling: dragging.savedGestures });
            dragging = undefined;
            if (current) latest.current.onDragEnd?.(current);
            setDragPosition(undefined);
        }

        element.addEventListener("pointerdown", onPointerDown);
        element.addEventListener("pointermove", onPointerMove);
        element.addEventListener("pointerup", onPointerUp);
        element.addEventListener("pointercancel", onPointerUp);
        for (const type of ["mousedown", "touchstart", "click", "dblclick"]) element.addEventListener(type, stop);
        return () => {
            element.removeEventListener("pointerdown", onPointerDown);
            element.removeEventListener("pointermove", onPointerMove);
            element.removeEventListener("pointerup", onPointerUp);
            element.removeEventListener("pointercancel", onPointerUp);
            for (const type of ["mousedown", "touchstart", "click", "dblclick"]) element.removeEventListener(type, stop);
            if (dragging) map!.setOptions({ gestureHandling: dragging.savedGestures });
            overlay.setMap(null);
        };
    }, [map, element, draggable]);

    if (!draggable) return { shownPosition: undefined, contentProps: undefined };
    return {
        shownPosition: dragPosition ?? position,
        contentProps: {
            ref: setElement,
            style: { touchAction: "none", cursor: dragPosition ? "grabbing" : "grab" } as React.CSSProperties,
        },
    };
}

export default function LocationMarker({ position, accuracy, color, invalid, expired, onDragEnd }:
    {
        position: google.maps.LatLngLiteral,
        accuracy?: number,
        color: MatchTeamColor,
        invalid?: boolean,
        expired?: boolean,
        // Makes the pin draggable (review mode), reporting where it's dropped
        onDragEnd?: (position: google.maps.LatLngLiteral) => void

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
    const easedLat = useEase(position.lat, 200, 13);
    const easedLng = useEase(position.lng, 200, 13);
    const { shownPosition, contentProps } = useMarkerDrag(position, onDragEnd);
    // A dragged pin is already where it's dropped; easing would slide it back from its old spot
    const positionEased = shownPosition ?? { lat: easedLat, lng: easedLng }
    const zoom = useMapZoom();
    const minRadius = zoom === undefined ? 0 : pixelsToMeters(MIN_ACCURACY_RADIUS_PX, positionEased.lat, zoom);
    // Clamp after easing so the minimum tracks zoom immediately.
    const accuracyRadius = Math.max(useEase(filteredAccuracy, 200), minRadius);
    return (
        <AdvancedMarker position={positionEased} clickable={!!onDragEnd}>
            {/* <P fz="xs">accurate: {accurate ? 'true' : 'false'}</P>
			<P fz="xs">expired: {expired ? 'true' : 'false'}</P>
			<P fz="xs">invalid: {invalid ? 'true' : 'false'}</P> */}
            {/* Grab area when draggable; adds no layout, the pin and photo position themselves */}
            <div {...contentProps}>
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
            </div>
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
