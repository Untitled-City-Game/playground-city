import { createUndoPoint } from "@/scripts/games/undo";
import { MoveContext } from "@/scripts/types/types";
import { LogAPI } from "boardgame.io/dist/types/src/plugins/plugin-log";
import { discardChallenge, drawToFull } from "../../challenge_deck/handManagement";
import { addLogMetadata } from "../../shared_moves/metadata";
import { ConnectFourGameState } from "@/scripts/games/connect_four/types";
import { Challenge } from "@/scripts/games/challenge_deck/challenge_deck_types";
import { checkVictory } from "@/scripts/games/connect_four/checkVictory";
import { actionsLocked, finishGame } from "@/scripts/games/shared_moves/manageGame";

export function completeChallengeAndClaim(
	context: MoveContext<ConnectFourGameState>,
	zoneID: number,
	challenge: string,
	// Evidence is uploaded after the move; the log references it by this ID
	// and attachEvidence fills in the URLs once the upload finishes.
	evidenceId?: string,
	fileTypes: string[] = []
) {
	const { G, log, playerID } = context;
	if (actionsLocked(G)) return "INVALID_MOVE";
	const challengeInfo = G.challengeDeck.find(challengeInfo => challengeInfo.title === challenge);
	if (challengeInfo === undefined) {
		throw new Error(`Challenge ${challenge} not found`);
	}
	// console.log("complete challenge and claim move found challenge ", challengeInfo);
	const claimData = claimZone({ G, log, playerID }, zoneID, challengeInfo);
	if(claimData === "INVALID_MOVE") return claimData;
	const previousVictory = G.victory;
	checkVictory(context);
	if (evidenceId && fileTypes.length > 0) {
		G.evidenceUploads ??= {};
		G.evidenceUploads[evidenceId] = { status: "uploading", playerID, fileTypes, urls: [] };
	}
	completeChallenge({ G, log, playerID }, challenge, evidenceId);
	drawToFull(context);
	const won = previousVictory === undefined && G.victory !== undefined;
	// After the draw, so the winner's refilled hand is cleared too.
	if (won) finishGame(G);
	createUndoPoint(G);
	addLogMetadata(
		{ log },
		{
			zone: zoneID,
			zoneName: G.zoneData[zoneID].name,
			team: G.allPlayersData[playerID].teamColor,
			challenge: challengeInfo.title,
			evidenceId,
			...(won && { victory: G.victory }),
		}
	);
}

export function claimZone(
	{ G, log, playerID }: { G: ConnectFourGameState; log: LogAPI; playerID: string; },
	zoneID: number,
	challenge: Challenge
) {
	const claimedZone = G.zoneData[zoneID];
	console.log("claiming zone", claimedZone.name, challenge.title);
	//regular claim
	if (!challenge.hard && claimedZone.controlTeam === null) {
		console.log("regular claim");
		claimedZone.controlTeam = G.allPlayersData[playerID].teamColor;
		addLogMetadata({ log }, { zone: zoneID, team: claimedZone.controlTeam, challenge: challenge.title });
		return {old: null, new: G.allPlayersData[playerID].teamColor}
	}


	//hard claim to lock
	else if (challenge.hard && claimedZone.controlTeam === null) {
		console.log("locking claim");
		claimedZone.controlTeam = G.allPlayersData[playerID].teamColor;
		claimedZone.locked = true;
		addLogMetadata({ log }, { zone: zoneID, team: claimedZone.controlTeam, challenge: challenge.title, claimType: "lock" });
		return {old: null, new: G.allPlayersData[playerID].teamColor}
	}


	//steal
	else if (challenge.hard && claimedZone.controlTeam !== null) {
		console.log("stealing claim");
		const oldTeam = claimedZone.controlTeam;
		claimedZone.controlTeam = G.allPlayersData[playerID].teamColor;
		claimedZone.locked = true;
		addLogMetadata({ log }, { zone: zoneID, team: claimedZone.controlTeam, challenge: challenge.title, claimType: "steal", stealFrom: oldTeam });
		return {old: oldTeam, new: G.allPlayersData[playerID].teamColor}
	}

	//illegal claim
	else if (!challenge.hard && claimedZone.controlTeam !== null) {
		console.log("invalid claim");
		return "INVALID_MOVE";
	}
	return "INVALID_MOVE";
}

export function completeChallenge(
	{ G, log, playerID }: { G: ConnectFourGameState; log: LogAPI; playerID: string; },
	challenge: string,
	evidenceId?: string
) {
	if (actionsLocked(G)) return "INVALID_MOVE";
	discardChallenge({ G, log, playerID }, challenge);
	addLogMetadata(
		{ log },
		{
			challenge,
			evidenceId,
			team: G.allPlayersData[playerID].teamColor,
		}
	);
}

