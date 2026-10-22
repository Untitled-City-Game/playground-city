import { completeChallenge, completeChallengeAndClaim } from "@/scripts/games/connect_four/moves/completeChallengeAndClaim";
import { discardChallenge, discardHand } from "@/scripts/games/challenge_deck/handManagement";
import { endGame, startGame } from "@/scripts/games/shared_moves/manageGame";
import { ConnectFourGameSetup, connectFourPlayerSetup, setStartingZone } from "@/scripts/games/connect_four/setup";
import customUndoTemplate from "@/scripts/games/undo";
import {
	GameSetupDataGeneric,
	StripContext,
	MoveContext
} from "@/scripts/types/types";
import type { Ctx, DefaultPluginAPIs, Game } from "boardgame.io";
import { ConnectFourGameSetupData, ConnectFourGameState } from "@/scripts/games/connect_four/types";
import { challengeDeckTeamSetup } from "@/scripts/games/challenge_deck/challenge_deck_team_setup";
import { addTeamPhoto } from "@/scripts/games/shared_moves/addTeamPhoto";
import { sharedMoves } from "@/scripts/games/shared_moves/sharedMoves";

export const handSize = 5;

const customUndo = (context: MoveContext<ConnectFourGameState>) => customUndoTemplate(context);

const claimStateMoves = {
	playerSetup: connectFourPlayerSetup,
	discardChallenge,
	discardHand,
	completeChallenge,
	completeChallengeAndClaim,
	customUndo,
	setStartingZone,
	...sharedMoves
};

export type ConnectFourMoves = StripContext<typeof claimStateMoves>;

export const ConnectFour: Game<ConnectFourGameState> = {
	name: `connect_four`,
	// We implement our own undo via the customUndo move + gameStateLogs, so the
	// engine's built-in undo stack is dead weight (it snapshots full G on every
	// move, dominating the persisted match size). Disable it.
	disableUndo: true,
	//set up game board using map json info
	// validateSetupData: (data) => isGameSetupData(data),
	setup: ({ ctx }, setupData : ConnectFourGameSetupData) => ConnectFourGameSetup(ctx, setupData),
	moves: {
		startGame : (args: any) => startGame<ConnectFourGameState>(args),
		playerSetup: connectFourPlayerSetup
	},
	turn: {
		onBegin: ({ events }) => {
			events.setActivePlayers({ all: "join" });
		},
		stages: {
			join: {
				moves: {
					playerSetup: connectFourPlayerSetup,
					setStartingZone,
					startGame : (args: any) => {
						challengeDeckTeamSetup(args)
						startGame<ConnectFourGameState>(args)
					},
					...sharedMoves
				},
			},
			play: {
				moves: claimStateMoves,
			},
		},
	},
}



