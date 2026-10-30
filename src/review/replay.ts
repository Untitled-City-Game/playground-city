import { ConnectFour } from "@/scripts/games/connect_four/connect_four";
import { Snake } from "@/scripts/games/snake/snake";
import { VISIBLE_LOG_TYPES } from "@/src/match/screens/match_tabs/game_log/visibleLogTypes";
import type { Game, LogEntry, State } from "boardgame.io";
import { CreateGameReducer, ProcessGameConfig } from "boardgame.io/internal";

// Rebuilds every state of a finished match from the files the game server
// stores for it (see scripts/fetch-log.sh). Starting from the initial state,
// each logged move is run through boardgame.io's own reducer, as the server did.

export type MatchFiles = {
	matchID: string;
	initial: State;
	log: LogEntry[];
	// Optional: the final state, to check the replay against
	state?: State;
	metadata?: { gameName?: string };
};

export type Replay = {
	// states[k] is the state after the first k log entries
	states: State[];
	// Log positions that are steps: the entry each step lands on
	steps: number[];
	// The replayed final state differs from the saved one
	mismatch: boolean;
};

const games: Record<string, Game> = {
	connect_four: ConnectFour as Game,
	snake: Snake as Game,
};

// The game server stores each file as { key, value }, keyed "<matchID>" for the
// state and "<matchID>:log" etc. for the rest. Files are matched by key, not name.
export async function parseMatchFiles(files: File[]): Promise<MatchFiles> {
	const parts: Record<string, unknown> = {};
	let matchID: string | undefined;
	for (const file of files) {
		let entry: { key?: unknown, value?: unknown };
		try {
			entry = JSON.parse(await file.text());
		} catch {
			throw new Error(`${file.name} isn't a JSON file`);
		}
		if (typeof entry.key !== "string" || entry.value === undefined) {
			throw new Error(`${file.name} isn't a match file from the game server`);
		}
		const [id, part = "state"] = entry.key.split(":");
		if (matchID && id !== matchID) {
			throw new Error(`Files are from different matches (${matchID} and ${id})`);
		}
		matchID = id;
		parts[part] = entry.value;
	}
	if (!matchID) throw new Error("No files selected");
	if (!parts.initial) throw new Error("Missing initial.json");
	if (!parts.log) throw new Error("Missing log.json");
	return {
		matchID,
		initial: parts.initial as State,
		log: parts.log as LogEntry[],
		state: parts.state as State | undefined,
		metadata: parts.metadata as MatchFiles["metadata"],
	};
}

export function replayMatch({ initial, log, state: saved }: MatchFiles): Replay {
	const game = games[initial.G.gameCode];
	if (!game) throw new Error(`Unknown game "${initial.G.gameCode}"`);
	const reducer = CreateGameReducer({ game: ProcessGameConfig(game) });

	// Moves read Date.now (game timer, pauses), so replay each one at the time
	// it was logged. Moves also log heavily; keep the console readable.
	const realNow = Date.now;
	const realLog = console.log;
	const states: State[] = [initial];
	try {
		console.log = () => {};
		let state = initial;
		for (const entry of log) {
			const time = Date.parse(entry.metadata?.date);
			Date.now = () => (Number.isNaN(time) ? realNow() : time);
			state = reducer(state, entry.action as any);
			states.push(state);
		}
	} finally {
		Date.now = realNow;
		console.log = realLog;
	}

	const steps = log.flatMap((entry, index) =>
		isStep(entry) ? [index] : []
	);
	const final = states[states.length - 1];
	const mismatch = saved !== undefined && comparable(saved.G) !== comparable(final.G);
	return { states, steps, mismatch };
}

// Undo has no log message but visibly changes the board, so it's a step too.
function isStep(entry: LogEntry) {
	const type = entry.action.payload.type;
	return VISIBLE_LOG_TYPES.includes(type) || type === "customUndo";
}

// The state shown for a step: everything up to the next step, so invisible
// follow-ups (e.g. evidence finishing its upload) appear with their message.
export function stepStateIndex(replay: Replay, step: number) {
	const next = replay.steps[step + 1];
	return next === undefined ? replay.states.length - 1 : next;
}

// Times differ by up to a second (log dates are stored to the second), and
// undo snapshots carry those times too.
function comparable(G: Record<string, unknown>) {
	const { startTime, endTime, pausedAt, gameStateLogs, ...rest } = G;
	return JSON.stringify(rest);
}
