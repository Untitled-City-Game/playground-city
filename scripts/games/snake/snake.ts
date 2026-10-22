import { addTeamPhoto } from "@/scripts/games/shared_moves/addTeamPhoto";
import { endGame, startGame } from "@/scripts/games/shared_moves/manageGame";
import { sharedMoves } from "@/scripts/games/shared_moves/sharedMoves";
import { completeChallengeAndEatFruit } from "@/scripts/games/snake/moves/eatFruit";
import { addSegment } from "@/scripts/games/snake/moves/manageSnakeBody";
import {updateFruit} from "@/scripts/games/snake/moves/spawnFruit";
import { snakeGameSetup } from "@/scripts/games/snake/setup";
import { snakePlayerSetup } from "@/scripts/games/snake/snakePlayerSetup";
import { SnakeGameState, SnakeGameSetupData } from "@/scripts/games/snake/types";
import customUndoTemplate from "@/scripts/games/undo";
import { MoveContext, StripContext } from "@/scripts/types/types";
import { Game } from "boardgame.io";


const customUndo = (context: MoveContext<SnakeGameState>) => customUndoTemplate(context);

const playStateMoves_Snake = {
	endGame,
	customUndo,
	playerSetup : snakePlayerSetup,
	addSegment,
	updateFruit,
	completeChallengeAndEatFruit,
	addTeamPhoto,
};
export type PlayStateMoves_Snake = StripContext<typeof playStateMoves_Snake>;

export const Snake: Game<SnakeGameState> = {
	name: `snake`,
	// Undo is handled by the customUndo move + gameStateLogs; disable the
	// engine's built-in undo stack so it doesn't snapshot full G every move.
	disableUndo: true,
	setup: ({ ctx }, setupData : SnakeGameSetupData) => snakeGameSetup(ctx, setupData),
	moves: {
		startGame : (args: any) => startGame<SnakeGameState>(args),
		playerSetup: snakePlayerSetup,
	},
	
	turn: {
		onBegin: ({ events }) => {
			events.setActivePlayers({ all: "join" });
		},
		stages: {
			join: {
				moves: {
					playerSetup: snakePlayerSetup,
					startGame : (args: any) => startGame<SnakeGameState>(args),
					...sharedMoves
				},
			},
			play: {
				moves: playStateMoves_Snake,
			},
		},
	},
}
