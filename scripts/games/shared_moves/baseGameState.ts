import { clampGameTime } from "@/scripts/consts";
import { AllPlayersData } from "@/scripts/types/types";

export function baseGameState<T extends string>(gameCode: T, gameName: string, gameTimeMinutes?: number) {
	return {
		gameCode,
		gameName,
		active: false,
		gameOver: false,
		gameTimeMinutes: clampGameTime(gameCode, gameTimeMinutes),
		allPlayersData: {} as AllPlayersData,
		allTeamsData: {},
		gameStateLogs: [],
		teamPhotoURLs: {},
	};
}
