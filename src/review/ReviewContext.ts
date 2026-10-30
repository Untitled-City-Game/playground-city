import { PlayerData } from "@/scripts/types/types";
import { createContext } from "react";

// Set only on the /review screen. Live code checks it to skip anything that
// talks to the server or the device (location sockets, geolocation, uploads).
// `now` is the time of the step being shown, for the frozen game timer.
export const ReviewContext = createContext<{ now: number } | undefined>(undefined);

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
};
export const ReviewControlsContext = createContext<ReviewControls | undefined>(undefined);
