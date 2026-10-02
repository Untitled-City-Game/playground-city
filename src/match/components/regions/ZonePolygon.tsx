import { ZoneData } from "@/scripts/games/connect_four/types";
import { LineData, PolyData } from "@/scripts/types/googleMaps";
import { Color } from "@/scripts/types/types";
import { zoneColors } from "@/scripts/zoneColors";
import DashedOutline from "@/src/match/components/regions/DashedOutline";
import PolygonLabel from "@/src/match/components/regions/PolygonLabel";
import { Polygon } from "@/src/match/googleMaps/shapes/Polygon";
import { Polyline } from "@/src/match/googleMaps/shapes/PolyLine";
import { theme } from "@/src/styles/theme";
import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import polylabel from "polylabel";
import { useEffect, useMemo, useState } from "react";
import { FaBan, FaLock } from "react-icons/fa";
import findPolygonCenter from "@/scripts/geojson/polygonCenter";
import { transformScale } from "@turf/turf";
import * as turf from "@turf/turf"
import useEase from "@/scripts/ease";

type ZonePolygonProps = {
	zone: PolyData;
	handleZoneClick: () => void;
	currentZone: ZoneData | undefined;
	zoneGameData: ZoneData;
	activeLine?: LineData;
	disabled?: boolean;
};

export default function ZonePolygon({
	zone,
	handleZoneClick,
	currentZone,
	zoneGameData,
	activeLine,
	disabled
}: ZonePolygonProps) {
	const amCurrentZone = zone.featureName === currentZone?.name;
	const amHighlighted = activeLine?.matchedPolygons.includes(zone.featureName)
	const coordsAsArray = useMemo(() => zone.coords.map((coord) => [coord.lat, coord.lng]), [zone.coords]);
	const polygonCenter = useMemo(() => findPolygonCenter(zone.coords), [zone.coords]);
	const smallVersionPaths = useMemo(() => {
		const smallVersion = turf.buffer(turf.polygon([coordsAsArray]), -0.0005, { units: "degrees" })
		return smallVersion?.geometry.coordinates[0].map(position => { return { lat: position[0], lng: position[1] } })
	}, [coordsAsArray]);
	const zoomThreshold = 15;
	const [zoom, setZoom] = useState(0);
	const map = useMap();
	useEffect(() => {
		if (map) {
			const listener = map.addListener("zoom_changed", () => {
				setZoom(map.getZoom() ?? 0);
			});
			return () => listener.remove();
		}
	}, [map]);


	const strokeColor = amCurrentZone ? zoneColors.selectedBorder :
		zoneGameData.controlTeam ? theme.colors[zoneGameData.controlTeam][6] :
			//amHighlighted ? zoneColors.lineMemberBorder :
			"black"

	const strokeWeightLogic = (zoneGameData.controlTeam && !zoneGameData.locked) ? 0 :
						amCurrentZone ? 5 :
							amHighlighted ?
								zoneGameData.controlTeam ? 4 : 3 :
								currentZone ? 0.5 : 2

	const strokeWeight = useEase(strokeWeightLogic, 100);

	const strokeOpacityLogic = amCurrentZone || amHighlighted ? 1 : 0.8
	const strokeOpacity = useEase(strokeOpacityLogic, 100);

	const fillColor = zoneGameData.controlTeam ? theme.colors[zoneGameData.controlTeam][6] :
						(disabled ? zoneColors.disabled :
							(amCurrentZone ? zoneColors.selectedFill :
								amHighlighted ? zoneColors.lineMemberFill :
									"#FFFFFF00"))


	const fillOpacityLogic = (zoom > zoomThreshold ? 0.01 :
						(currentZone && !amHighlighted) ? 0.15 :
							amCurrentZone ? 0.5 :
								zoneGameData.locked ? 0.4 :
									amHighlighted && zoneGameData.controlTeam ? 0.4 :
										disabled ? 0.5 :
											amHighlighted ? 0.4 :
												currentZone ? 0.05 :
													zoneGameData.controlTeam ? 0.15 : 0)

	const fillOpacity = useEase(fillOpacityLogic, 100);


	return (
		<>
			{(zoneGameData.controlTeam && !zoneGameData.locked) ? <DashedOutline zone={zone} color={zoneGameData.controlTeam || "black"} /> : null}
			{/* <Polygon 
				paths={smallVersionPaths}
				strokeColor="black"
				strokeWeight={2}
				strokeOpacity={1}
				key={zone.featureName + "small"}
			/> */}
			<Polygon

				strokePosition={google.maps.StrokePosition.INSIDE}
				paths={zone.coords}
				key={zone.featureName}
				strokeColor={strokeColor}
				strokeOpacity={strokeOpacity}
				strokeWeight={strokeWeight}
				fillColor={fillColor}
				fillOpacity={fillOpacity}
				onClick={() => {
					if ((map?.getZoom() ?? 30) > zoomThreshold) { return };
					handleZoneClick();

				}
				}
				zIndex={
					zoneGameData.controlTeam && amCurrentZone ? 26 :
						zoneGameData.controlTeam && amHighlighted ? 24 :
							amCurrentZone ? 23 :
								amHighlighted ? 22 :
									zoneGameData.controlTeam ? 1 : 0}
			/>
			{amHighlighted ?
				<PolygonLabel
					label={zone.featureName}
					//label={String(fillOpacity)}
					position={polygonCenter}
					zoom={zoom}
					locked={zoneGameData.locked}
					color={zoneGameData.controlTeam ?? undefined}
					selected={amCurrentZone}
					disabled={disabled}
					handleClick={handleZoneClick}
				/>
				: null}
			{zoneGameData.locked && !amHighlighted ?
				<AdvancedMarker position={polygonCenter} anchorTop="-50%">
					<FaLock size="2rem" color={theme.colors[zoneGameData.controlTeam || "yellow"][6] || undefined} />
				</AdvancedMarker>
				: null}
			{disabled && !amHighlighted ?
				<AdvancedMarker position={polygonCenter}>
					<FaBan size="2rem" color="black" style={{ position: "relative", left: "20%", top: "70%" }} />
				</AdvancedMarker>
				: null}
		</>
	);
}
