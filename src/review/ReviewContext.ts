import { PlayerData } from "@/scripts/types/types";
import { createContext } from "react";

// Set only on the /review screen. Live code checks it to skip anything that
// talks to the server or the device (location sockets, geolocation, uploads).
// `now` is the time of the step being shown, for the frozen game timer.
// `claimPopups` is off when the reviewer has hidden other teams' claim popups.
// `teamMarkers` are draggable stand-ins for team locations, which aren't logged.
export const ReviewContext = createContext<{
	now: number,
	claimPopups: boolean,
	teamMarkers: {
		enabled: boolean,
		// Per team; teams not moved yet start at the map's centre
		positions: Record<string, google.maps.LatLngLiteral>,
		move: (team: string, position: google.maps.LatLngLiteral) => void,
	},
} | undefined>(undefined);

// Clickable review controls, shown in the settings menu.
export type ReviewControls = {
	step: number;
	stepCount: number;
	stepLabel: string;
	goTo: (step: number) => void;
	players: PlayerData[];
	playerID: string;
	setPlayerID: (playerID: string) => void;
	exit: () => void;
	mismatch: boolean;
	claimPopups: boolean;
	setClaimPopups: (show: boolean) => void;
	teamMarkers: boolean;
	setTeamMarkers: (show: boolean) => void;
};
export const ReviewControlsContext = createContext<ReviewControls | undefined>(undefined);
