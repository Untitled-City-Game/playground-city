import { Challenge, ChallengeGameGameState, RawChallenge, TeamChallengeData } from "@/scripts/games/challenge_deck/challenge_deck_types";
import { handSize } from "@/scripts/games/connect_four/connect_four";
import { addLogMetadata } from "@/scripts/games/shared_moves/metadata";
import { createUndoPoint } from "@/scripts/games/undo";
import { MatchTeamColor, MoveContext } from "@/scripts/types/types";
import { LogAPI } from "boardgame.io/dist/types/src/plugins/plugin-log";
import { findLastIndex, remove } from "lodash";

export function discardChallenge(
	{ G, playerID }: { G: ChallengeGameGameState; log: LogAPI; playerID: string; },
	challenge: string
) {
	const team = G.allPlayersData[playerID].teamColor;
	//remove challenge from challenge hand
	const teamData = G.allTeamsChallengeData[team];
	const removedChallenge = remove(
		teamData.challengeHand,
		(challengeInHand) => challengeInHand.title === challenge
	);
	teamData.challengeDiscard.push(...removedChallenge);
}

export function drawChallenge({ G, playerID }: { G: ChallengeGameGameState; playerID: string; }, teamData: TeamChallengeData) {
	//check numbers of hard vs normal challenges
	const hardChallenges = teamData.challengeHand.filter(challenge => challenge.hard).length

	if (teamData.challengeDeck.length === 0) {
		console.log("no cards left in deck");
		return("NO_CARDS")
	}

	//keep a balance of hard challenges in hand: at least one, at most two
	const wanted = (challenge: Challenge) =>
		hardChallenges === 0 ? Boolean(challenge.hard) :
		hardChallenges >= 2 ? !challenge.hard :
		true;

	//avoid challenges other teams have already drawn, unless nothing else is left
	const drawnElsewhere = challengesDrawnByOtherTeams(G, teamData);
	const fresh = (challenge: Challenge) => !drawnElsewhere.has(challenge.title);

	//deck is shuffled, so taking the last match is a random draw
	const index = [
		(challenge: Challenge) => wanted(challenge) && fresh(challenge),
		wanted,
		fresh,
	].map(rule => findLastIndex(teamData.challengeDeck, rule)).find(index => index !== -1)
		?? teamData.challengeDeck.length - 1;
	const drawnChallenge = teamData.challengeDeck.splice(index, 1)[0];
	teamData.challengeHand.unshift(drawnChallenge);
	console.log("drawn challenge", drawnChallenge.title);
}

function challengesDrawnByOtherTeams(G: ChallengeGameGameState, teamData: TeamChallengeData) {
	const titles = new Set<string>();
	for (const otherTeam of Object.values(G.allTeamsChallengeData)) {
		if (otherTeam === teamData) continue;
		for (const challenge of [...otherTeam.challengeHand, ...otherTeam.challengeDiscard]) {
			titles.add(challenge.title);
		}
	}
	return titles;
}

export function drawToFull({ G, playerID }: MoveContext<ChallengeGameGameState>, team?: MatchTeamColor) {
	console.log("drawing to full", team);
	const teamData = team ? G.allTeamsChallengeData[team] : G.allTeamsChallengeData[G.allPlayersData[playerID].teamColor];
	while (teamData.challengeHand.length < handSize) {
		const errorCheck = drawChallenge({ G, playerID }, teamData);
		if(errorCheck === "NO_CARDS") {
			break;
		}
	}
}

export function discardHand(context: MoveContext<ChallengeGameGameState>) {
	const { G, playerID, log } = context;
	const team = G.allPlayersData[playerID].teamColor;
	const teamData = G.allTeamsChallengeData[team];
	
	//Don't discard if 0 challenges left, or after the game has ended
	if(teamData.challengeDeck.length === 0 || G.gameOver){
		return "INVALID_MOVE"
	}
	
	teamData.challengeDiscard.push(...teamData.challengeHand);
	teamData.challengeHand = [];
	drawToFull(context);
	createUndoPoint(G);
	addLogMetadata(
		{ log },
		{ team: G.allPlayersData[0].teamColor }
	);

}

export function createChallengeDeck(challengeData: RawChallenge[], winter?: boolean, money?: boolean) {
	const filteredChallengeData = filterChallenges(challengeData, {winter, money})
	const structuredChallengeData = structureChallenges(filteredChallengeData);
	return structuredChallengeData;
}

function filterChallenges(challengeData: RawChallenge[], filters : {winter?: boolean, money?: boolean}){
	return challengeData.filter(challenge => {
		for (const [key, value] of Object.entries(filters)){
			if(value && challenge[`exclude_${key}` as keyof RawChallenge]){
				return false
			}
		}
		return true;
	})
}

function structureChallenges(challengeData : RawChallenge[]) : Challenge[]{
	return challengeData.filter(challenge => challenge.title?.trim()).map(challenge => {
		return {
			title: challenge.title,
			description: challenge.description,
			hard : challenge.hard,
			emoji: challenge.emoji,
			rules: [challenge.rule1, challenge.rule2, challenge.rule3, challenge.rule4],
			link: {
				name: challenge.link_name,
				url: challenge.link
			}
		} as Challenge
	})
}
