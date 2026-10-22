import { ConnectFourGameSetupData, ConnectFourGameState, ZoneData } from "@/scripts/games/connect_four/types";
import { createChallengeDeck } from "@/scripts/games/challenge_deck/handManagement";
import { PolyData } from "@/scripts/types/googleMaps";
import { MoveContext, PlayerData } from "@/scripts/types/types";
import type { Ctx } from "boardgame.io";
import { playerSetup } from "@/scripts/games/shared_moves/playerSetup";
import { challengeDeckPlayerSetup } from "@/scripts/games/challenge_deck/challenge_deck_player_setup";
import { baseGameState } from "@/scripts/games/shared_moves/baseGameState";

export function ConnectFourGameSetup(ctx: Ctx, setupData: ConnectFourGameSetupData): ConnectFourGameState {
	console.log("ConnectFourGameSetup - startingZone:", setupData.startingZone, "challengeData rows:", setupData.challengeData?.length);
	return {
		...baseGameState("connect_four", setupData.gameName),
		zoneData: createBoardFromMapJson(setupData.mapSetupData.zonePolygons),
		MatchMapData: setupData.mapSetupData,
		challengeDeck: createChallengeDeck(setupData.challengeData, setupData.winter, setupData.money),
		allTeamsChallengeData: {},
		city: setupData.mapSetupData.city,
		startingZone: setupData.startingZone,
	};
}

export function createBoardFromMapJson(mapData: PolyData[]): ZoneData[] {
	return mapData.map((zone, index) => {
		return {
			id: index,
			status: "empty",
			name: zone.featureName,
			controlTeam: null,
			locked: false
		};
	});
}

export function connectFourPlayerSetup(context: MoveContext<ConnectFourGameState>, newPlayerData: PlayerData){
	playerSetup(context, newPlayerData)
	challengeDeckPlayerSetup(context, newPlayerData)
}

export function setStartingZone(context: MoveContext<ConnectFourGameState>, startingZone: string){
	context.G.startingZone = startingZone
}