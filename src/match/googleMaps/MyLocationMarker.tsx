import { EXPIRE_TIME, gameLocationCenters } from "@/scripts/consts";
import { CoordSet, MatchTeamColor } from "@/scripts/types/types";
import LocationMarker from "@/src/match/googleMaps/LocationMarker";
import useMyLocation, { useAndBroadcastMyLocation } from "@/src/match/interfaces/useMyLocation";

export default function MyLocationMarker(
	{color, defaultLocation, matchID, playerID="", broadcast=false} : {color: MatchTeamColor, defaultLocation: google.maps.LatLngLiteral, matchID: string, playerID?:string, broadcast?: boolean}
){
	const {position, accuracy, time, invalid} = useAndBroadcastMyLocation(color, playerID, matchID, defaultLocation || { lat: 0, lng: 0 })
	
	return (
		<LocationMarker position={position || defaultLocation} color={color} accuracy={accuracy} invalid={invalid} />
	)
}