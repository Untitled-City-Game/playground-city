import { MoveContext, GameStateUniversal, GameStateLog, GameStateAnything } from "@/scripts/types/types";

export default function customUndoTemplate<T extends GameStateUniversal>(context: MoveContext<T>): T | "INVALID_MOVE" {
	console.log("custom undo activated");
	let G = context.G;
	const gameStateLogs = G.gameStateLogs;
	if(gameStateLogs.length <= 1){
		console.log("Can't undo, no history")
		return "INVALID_MOVE";
	}
	const lastState = G.gameStateLogs[G.gameStateLogs.length - 2];
	if(!lastState){
		throw new Error("Type of laststate was not expected");
	}
	// Spread the live G first so static fields excluded from the snapshot
	// (MatchMapData, challengeDeck — see createUndoPoint) are preserved, then
	// overlay the saved mutable state and trim the log.
	return {
		...G,
		...lastState,
		gameStateLogs: G.gameStateLogs.slice(0,-1),
	} as T
}

export function createUndoPoint<GameState extends GameStateUniversal>(G: GameState){
	// Exclude gameStateLogs (avoids nesting) and the static-after-setup fields,
	// which are restored from the live state on undo rather than copied here.
	const { gameStateLogs, MatchMapData, challengeDeck, ...rest } = G as GameStateAnything;
	G.gameStateLogs.push(rest as GameStateLog<GameState>);
}