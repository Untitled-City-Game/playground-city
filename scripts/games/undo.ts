import { MoveContext, GameStateUniversal, GameStateLog, GameStateAnything } from "@/scripts/types/types";

export default function customUndoTemplate<T extends GameStateUniversal>(context: MoveContext<T>): T | "INVALID_MOVE" {
	console.log("custom undo activated");
	let G = context.G;
	if(G.gameOver){
		console.log("Can't undo, game has ended")
		return "INVALID_MOVE";
	}
	const gameStateLogs = G.gameStateLogs;
	if(gameStateLogs.length <= 1){
		console.log("Can't undo, no history")
		return "INVALID_MOVE";
	}
	const lastState = G.gameStateLogs[G.gameStateLogs.length - 2];
	if(!lastState){
		throw new Error("Type of laststate was not expected");
	}
	// Rebuild from the snapshot, carrying over only the static fields it
	// excludes (MatchMapData, challengeDeck — see createUndoPoint). Spreading
	// the live G underneath would leak fields the snapshot lacks: optional
	// fields that were unset at snapshot time (e.g. victory) are absent from
	// it, so they would survive the undo.
	// evidenceUploads is kept live too, so media that finished uploading after
	// the snapshot isn't lost.
	const { MatchMapData, challengeDeck, evidenceUploads } = G as GameStateAnything;
	return {
		...lastState,
		...(MatchMapData !== undefined && { MatchMapData }),
		...(challengeDeck !== undefined && { challengeDeck }),
		...(evidenceUploads !== undefined && { evidenceUploads }),
		gameStateLogs: G.gameStateLogs.slice(0,-1),
	} as unknown as T
}

export function createUndoPoint<GameState extends GameStateUniversal>(G: GameState){
	// Exclude gameStateLogs (avoids nesting) and the static-after-setup fields,
	// which are restored from the live state on undo rather than copied here.
	const { gameStateLogs, MatchMapData, challengeDeck, evidenceUploads, ...rest } = G as GameStateAnything;
	G.gameStateLogs.push(rest as GameStateLog<GameState>);
}