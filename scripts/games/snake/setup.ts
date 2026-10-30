import { baseGameState } from "@/scripts/games/shared_moves/baseGameState";
import {spawnFruit} from "@/scripts/games/snake/moves/spawnFruit";
import { SnakeGameSetupData, SnakeGameState } from "@/scripts/games/snake/types";
import { Ctx } from "boardgame.io";

export function snakeGameSetup(ctx: Ctx, setupData: SnakeGameSetupData): SnakeGameState {
	return {
		...baseGameState("snake", setupData.gameName, setupData.gameTimeMinutes),
		fruits: spawnFruit([], setupData.mapArea),
		snakeTeamData: {},
		mapArea: setupData.mapArea,
	};
}