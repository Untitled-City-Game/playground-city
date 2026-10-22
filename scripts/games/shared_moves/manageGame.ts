import { gameTimeMinutes } from "@/scripts/consts";
import { createUndoPoint } from "@/scripts/games/undo";
import { GameStateAnything, GameStateUniversal, MoveContext } from "@/scripts/types/types";
import { addLogMetadata } from "./metadata";

export function startGame<GameState extends GameStateUniversal>(context: MoveContext<GameState>) {
	console.log("starting game")
	const { events, G, random, log } = context;
	console.log("all players data", G.allPlayersData)
	G.active = true;
	events.setActivePlayers({ all: "play" });
	startGameTimer<GameState>(G);
	createUndoPoint<GameState>(G);
	addLogMetadata(
		{ log },
		{ team: G.allPlayersData[0].teamColor }
	);
} 

export function startGameTimer<SomeGameState extends GameStateUniversal>(G: SomeGameState) {
	const startTime = Date.now();
	G.startTime = startTime;
	G.endTime = startTime + gameTimeMinutes * 60 * 1000;
}

export function endGame({ G, log, playerID }: MoveContext<GameStateUniversal>) {
	if (G.gameOver) return "INVALID_MOVE";
	console.log("ending game");
	G.gameOver = true;
	// The match stays live after it ends (so the map and log remain usable), but
	// with empty hands there's nothing left to complete or claim with.
	const { allTeamsChallengeData } = G as GameStateAnything;
	for (const teamData of Object.values(allTeamsChallengeData ?? {})) {
		teamData.challengeDiscard.push(...teamData.challengeHand);
		teamData.challengeHand = [];
	}
	addLogMetadata(
		{ log },
		{ team: G.allPlayersData[playerID].teamColor }
	);
}

