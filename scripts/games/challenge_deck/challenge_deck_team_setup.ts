import { ChallengeGameGameState } from "@/scripts/games/challenge_deck/challenge_deck_types";
import { ConnectFourGameState } from "@/scripts/games/connect_four/types";
import { drawToFull } from "@/scripts/games/challenge_deck/handManagement";
import { MatchTeamColor, MoveContext } from "@/scripts/types/types";

export function challengeDeckTeamSetup(context: MoveContext<ChallengeGameGameState>) {
	const { G, random } = context;
	console.log("setting up challenge deck data", G.allTeamsChallengeData);
	//extract team colors from players
	for (const [teamColor, team] of Object.entries(G.allTeamsChallengeData)) {
		console.log("setting up team ", teamColor);
		const shuffledDeck = random.Shuffle(G.challengeDeck);
		team.challengeDeck = shuffledDeck;
		team.challengeHand = [];
		team.challengeDiscard = [];
	}
	//draw only once every team is reset, since each draw avoids challenges
	//other teams already hold
	for (const teamColor of Object.keys(G.allTeamsChallengeData)) {
		drawToFull(context, teamColor as MatchTeamColor);
	}
}

export function newTeamChallengeData (){
	return {
		challengeDeck: [],
		challengeHand: [],
		challengeDiscard: [],
	}
}
