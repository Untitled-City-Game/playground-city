import { socket } from "@/scripts/socket";
import { LocationData } from "@/scripts/types/types";
import { useState, useEffect } from "react";

export default function useTeamLocations(matchID: string) {
	const [teamLocations, setTeamLocations] = useState<LocationData[]>([]);
	useEffect(() => {
		console.warn('useTeamLocations mounted');
		return () => console.log('useTeamLocations unmounted');
	}, []);

	useEffect(() => {
		function joinMatch() {
			if (matchID) socket.emit("joinMatch", matchID);
		}

		function onConnect() {
			console.warn("socket.io location server is connected now")
			joinMatch();
		}

		function onDisconnect() {
			console.warn("socket.io location server is disconnected now")
		}

		function onLocationUpdate(value: LocationData) {
			//console.warn("Received location update broadcast", value);
			// Defense in depth: ignore updates that aren't for this match.
			if (value.matchID !== matchID) return;
			setTeamLocations(previous => {
				//console.log("searhing existing data", previous)
				const index = previous.findIndex(teamData => teamData.teamName === value.teamName);
				if (index === -1) {
					return [...previous, value];
				}
				
				//Create a new array with the updated value
				const updated = [...previous];
				updated[index] = value;
				return updated;
			});
		}

		// Join immediately if the socket is already connected; otherwise the
		// 'connect' handler will join (and re-join after any reconnect).
		if (socket.connected) joinMatch();

		socket.on('connect', onConnect);
		socket.on('disconnect', onDisconnect);
		socket.on('locationUpdate', onLocationUpdate);

		return () => {
			console.warn("team locations cleanup!")
			socket.off('connect', onConnect);
			socket.off('disconnect', onDisconnect);
			socket.off('locationUpdate', onLocationUpdate);
		};
	}, [matchID]);

	return teamLocations
}

