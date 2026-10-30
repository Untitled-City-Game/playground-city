import { ClientSetupData, GameStateGeneric, PlayerData } from "@/scripts/types/types";
import { ConnectFourBoard, SnakeBoard } from "@/src/match/Board";
import { matchTheme } from "@/src/match/Client";
import { ReviewContext, ReviewControls, ReviewControlsContext } from "@/src/review/ReviewContext";
import { useReviewFiles } from "@/src/review/ReviewLayout";
import { MatchFiles, Replay, replayMatch, stepStateIndex } from "@/src/review/replay";
import { Alert, Container, MantineProvider } from "@mantine/core";
import type { BoardProps } from "boardgame.io/react";
import { useCallback, useEffect, useMemo } from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router";

// Every move is accepted and ignored: buttons look and respond as in a live
// match, but nothing changes.
const noMoves = new Proxy({}, { get: () => () => {} });

// Short descriptions of each step for the review controls
const stepNames: Record<string, string> = {
	completeChallengeAndClaim: "claimed a neighbourhood",
	completeChallengeAndEatFruit: "ate a fruit",
	playerSetup: "joined",
	startGame: "started the game",
	endGame: "ended the game",
	pauseGame: "paused the game",
	unpauseGame: "resumed the game",
	sendChatMessage: "sent a message",
	discardHand: "discarded their hand",
	customUndo: "undid the last action",
};

export default function ReviewMatch() {
	const { files } = useReviewFiles();
	const { matchID } = useParams();
	if (!files || files.matchID !== matchID) return <Navigate to="/review" replace />;
	return <ReviewReplay files={files} />;
}

function ReviewReplay({ files }: { files: MatchFiles }) {
	const replay = useMemo(() => {
		try {
			return replayMatch(files);
		} catch (error) {
			return error instanceof Error ? error : new Error(String(error));
		}
	}, [files]);

	if (replay instanceof Error) {
		return <Container pt="xl"><Alert color="red">Couldn't replay this match: {replay.message}</Alert></Container>;
	}
	if (replay.steps.length === 0) {
		return <Container pt="xl"><Alert color="yellow">This match has nothing to review yet.</Alert></Container>;
	}
	return <ReviewView files={files} replay={replay} />;
}

function ReviewView({ files, replay }: { files: MatchFiles; replay: Replay }) {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const finalG = replay.states[replay.states.length - 1].G as GameStateGeneric;
	const players = useMemo(
		() => Object.values(finalG.allPlayersData).sort((a, b) => Number(a.playerID) - Number(b.playerID)),
		[finalG]
	);
	const lastStep = replay.steps.length - 1;

	const playerID = finalG.allPlayersData[searchParams.get("player") ?? ""] ? searchParams.get("player")! : players[0].playerID;
	// Default to the first step this player can see the match from
	const firstStep = useMemo(() => {
		const index = replay.steps.findIndex((_, step) =>
			replay.states[stepStateIndex(replay, step)].G.allPlayersData[playerID]
		);
		return index === -1 ? 0 : index;
	}, [replay, playerID]);
	const requestedStep = Number(searchParams.get("step"));
	const step = searchParams.has("step") && Number.isInteger(requestedStep)
		? Math.min(Math.max(requestedStep - 1, 0), lastStep)
		: firstStep;

	const goTo = useCallback((target: number) => {
		const clamped = Math.min(Math.max(target, 0), lastStep);
		setSearchParams(params => {
			params.set("step", String(clamped + 1));
			return params;
		}, { replace: true });
	}, [lastStep, setSearchParams]);

	const setPlayerID = useCallback((id: string) => {
		setSearchParams(params => {
			params.set("player", id);
			params.set("step", String(step + 1));
			return params;
		}, { replace: true });
	}, [setSearchParams, step]);

	useStepKeys(step, lastStep, goTo);

	const stateIndex = stepStateIndex(replay, step);
	const state = replay.states[stateIndex];
	const log = useMemo(() => files.log.slice(0, stateIndex), [files.log, stateIndex]);

	const entry = files.log[replay.steps[step]];
	const parsedTime = Date.parse(entry.metadata?.date);
	const now = Number.isNaN(parsedTime) ? (state.G.startTime ?? Date.now()) : parsedTime;
	const sender = finalG.allPlayersData[entry.action.payload.playerID];
	const stepLabel = `${new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · ${sender?.name ?? "Someone"} ${stepNames[entry.action.payload.type] ?? entry.action.payload.type}`;

	// Shown as the host would see it, so the admin buttons appear as in a live match
	const playerData = useMemo(() => ({
		data: { ...finalG.allPlayersData[playerID], matchID: files.matchID, gameCode: finalG.gameCode, admin: true } as PlayerData,
	}), [finalG, playerID, files.matchID]);

	const controls: ReviewControls = {
		step,
		stepCount: replay.steps.length,
		stepLabel,
		goTo,
		players,
		playerID,
		setPlayerID,
		exit: () => navigate("/review"),
		mismatch: replay.mismatch,
	};
	const review = useMemo(() => ({ now }), [now]);

	const boardProps = {
		G: state.G,
		ctx: state.ctx,
		log,
		moves: noMoves,
		events: {},
		plugins: state.plugins,
		_undo: [],
		_redo: [],
		_stateID: state._stateID,
		matchID: files.matchID,
		playerID,
		credentials: undefined,
		gameCode: finalG.gameCode,
		playerData,
		isActive: false,
		isMultiplayer: false,
		isConnected: true,
		matchData: undefined,
		chatMessages: [],
		sendChatMessage: () => {},
		undo: () => {},
		redo: () => {},
		reset: () => {},
	} as unknown as BoardProps<any> & ClientSetupData;

	return (
		<MantineProvider theme={matchTheme(finalG.gameCode)}>
			<ReviewContext value={review}>
				<ReviewControlsContext value={controls}>
					{finalG.gameCode === "snake" ? <SnakeBoard {...boardProps} /> : <ConnectFourBoard {...boardProps} />}
				</ReviewControlsContext>
			</ReviewContext>
		</MantineProvider>
	);
}

// Arrow keys (or A/D) step, Home/End jump to the ends. Left alone while typing (e.g. in
// the chat box) or when a tab has focus, where arrows switch tabs.
function useStepKeys(step: number, lastStep: number, goTo: (step: number) => void) {
	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			const target = event.target as HTMLElement | null;
			if (target?.closest("input, textarea, select, [contenteditable=true], [role=tab]")) return;
			if (event.altKey || event.ctrlKey || event.metaKey) return;
			const next = {
				ArrowRight: step + 1,
				d: step + 1,
				ArrowLeft: step - 1,
				a: step - 1,
				Home: 0,
				End: lastStep,
			}[event.key.length === 1 ? event.key.toLowerCase() : event.key];
			if (next === undefined) return;
			event.preventDefault();
			goTo(next);
		}
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [step, lastStep, goTo]);
}
