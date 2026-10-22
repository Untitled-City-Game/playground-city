import { ChallengeDeck, RawChallenge } from "@/scripts/games/challenge_deck/challenge_deck_types";
import { GameStateUniversal, MatchMapData, GameStateLog, Color, zoneStatus, CityOrCustom, GameSetupDataGeneric } from "@/scripts/types/types";

//Game state


export interface ConnectFourGameSetupData extends GameSetupDataGeneric {
	mapSetupData: MatchMapData,
	city : CityOrCustom;
	startingZone: string;
	challengeData: RawChallenge[];
}

export interface ConnectFourGameState extends GameStateUniversal, ChallengeDeck {
	gameCode: "connect_four",
	city: CityOrCustom,
	zoneData: ZoneData[],
	MatchMapData: MatchMapData,
	active: boolean,
	gameStateLogs: GameStateLog<ConnectFourGameState>[],
	startingZone?: string
}

export type ZoneData = {
	id: number;
	status: zoneStatus;
	name: string;
	controlTeam: Color | null;
	locked: boolean;
}
