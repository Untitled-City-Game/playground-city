import { ACCURACY_MAX, EXPIRE_TIME } from "@/scripts/consts";
import { socket } from "@/scripts/socket";
import { LocationData, LocationResult, MatchTeamColor } from "@/scripts/types/types";
import useInterval from "@/scripts/useInterval";
import { OtherTeamsContext } from "@/src/match/Board";
import { ReviewContext } from "@/src/review/ReviewContext";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { useContext, useEffect, useRef, useState } from "react";
import { useGeolocated } from "react-geolocated";
import { FaCircle } from "react-icons/fa";

export default function useMyLocation(initialPosition?: google.maps.LatLngLiteral) : LocationResult {
	const [position, setPosition] = useState(initialPosition || { lat: 0, lng: 0 });
	const [accuracy, setAccuracy] = useState<number | undefined>(undefined);

	const [invalid, setInvalid] = useState(false);
	// Reviewing a past match: the viewer's own location is irrelevant
	const review = useContext(ReviewContext);

	const geoLocation = useGeolocated({
		positionOptions: {
			enableHighAccuracy: true,
		},
		watchPosition: true,
		userDecisionTimeout: 100000,
		suppressLocationOnMount: review !== undefined,
	});
	const coords = geoLocation.coords;

	useEffect(() => {
		if (!coords) {
			console.warn("no coords for location hook");
			setInvalid(true)
			return;
		}

		const latlongcoords: google.maps.LatLngLiteral = { lat: coords.latitude, lng: coords.longitude }
		setPosition(latlongcoords);
		setAccuracy(coords.accuracy);
		setInvalid(false);
	}
		, [coords, geoLocation.timestamp]);

	const time = geoLocation.timestamp
	//console.log("updated geolocation", position, accuracy, time)

	return { position, accuracy, time, invalid }
}

export function useAndBroadcastMyLocation(teamName: MatchTeamColor, playerID: string, matchID: string, initialPosition?: google.maps.LatLngLiteral) {
	const [position, setPosition] = useState(initialPosition || { lat: 0, lng: 0 });
	const [accuracy, setAccuracy] = useState<number>(9999)
	const [invalid, setInvalid] = useState(true)

	const teamLocations = useContext(OtherTeamsContext)
	// Never broadcast while reviewing: it would put the viewer into the real match
	const review = useContext(ReviewContext);
	
	const geoLocation = useGeolocated({
		positionOptions: {
			enableHighAccuracy: true,
		},
		watchPosition: true,
		userDecisionTimeout: 100000,
		suppressLocationOnMount: review !== undefined,
	});

	function updateServer() {
		if (review) return;
		socket.connect();
		const location_data = generateLocationData();
		if (location_data !== null) {
			socket.emit("locationUpdate", location_data);
		}
	}

	function updateLocalPosition() {
		const coords = geoLocation.coords;
		
		if(!coords){
			console.warn("Location api returned no position");
			setInvalid(true);
			return;
		}

		//set state
		setPosition({ lat: coords.latitude, lng: coords.longitude });
		setAccuracy(coords.accuracy);
		setInvalid(false);

		console.warn("local geolocation coords updated! accuracy:", coords.accuracy);
	}

	function generateLocationData(): LocationData | null {
		const location_data = {
			matchID,
			teamName,
			playerID,
			location: position,
			accuracy: accuracy,
			timestamp: undefined as any,
			invalid: false
		}
		const coords = geoLocation.coords;
		
		//if location data returned an error (e.g. location sharing not permitted)
		if (!coords) {
			location_data.invalid = true;
		} else {
			//set data
			location_data.location = { lat: coords.latitude, lng: coords.longitude }
			location_data.accuracy = coords.accuracy
			location_data.timestamp = Date.now()
		}

		//console.log("prepared regular timed update", location_data, teamLocations.length);

		//Check if my position is not useful for update
		const myTeamLastLocation = teamLocations.find(team => team.teamName === teamName)

		//if there's no existing location data for this team
		if (!myTeamLastLocation) {
			//console.warn("broadcasting location, no others exist for my team")
			return location_data
		}

		//if the existing location data is my own
		if (myTeamLastLocation.playerID === playerID) {
			//console.warn("broadcasting location, current one is mine")
			return location_data
		}

		//if the only data is invalid, and mine is not invalid
		if (myTeamLastLocation.invalid && !location_data.invalid) {
			//console.warn("broadcasting location, existing is invalid")
			return location_data
		}

		//if the existing location data is out of date
		if ((location_data.timestamp - myTeamLastLocation.timestamp) > EXPIRE_TIME) {
			//console.warn("broadcasting location, existing is out of date")
			return location_data
		}

		//if my read is more accurate
		if (location_data.accuracy < myTeamLastLocation.accuracy) {
			//console.warn("broadcasting location, mine is more accurate")
			return location_data
		}

		//or, if it's not useful
		//console.warn("timed update not useful, quitting.")
		return null;

	}

	//Poll location updates
	useInterval(() => {
		updateServer()

	}, EXPIRE_TIME);

	//Update when coords update
	useEffect(() => {
		updateLocalPosition()
		updateServer()
	}, [geoLocation.coords])

	const time = geoLocation.timestamp

	return { position, accuracy, time, invalid }
}