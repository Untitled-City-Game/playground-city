import { ConnectFourMoves } from "@/scripts/games/connect_four/connect_four";
import { actionsLocked } from "@/scripts/games/shared_moves/manageGame";
import { ChallengeDeckContext, ConnectFourContext, GameContext } from "@/src/match/Board";
import ClaimFlowModal from "@/src/match/components/regions/region_claim_flow/ClaimFlowModal";
import useMyLocation from "@/src/match/interfaces/useMyLocation";
import useMyZone from "@/src/match/interfaces/useMyZone";
import { ClaimButton } from "@/src/match/screens/match_tabs/challenges/UI/ChallengeCard";
import { ChallengeBody } from "@/src/match/screens/match_tabs/challenges/UI/ChallengePopup";
import RuleBox from "@/src/match/screens/match_tabs/challenges/UI/RuleBox";
import { TabAlertsContext } from "@/src/match/screens/match_tabs/TabSet";
import ConfirmButton from "@/src/userInterface/ConfirmModal";
import { ComplexHeader } from "@/src/userInterface/Header/Header";
import P from "@/src/userInterface/P";
import Span from "@/src/userInterface/Span";
import { Box, Container, Stack, Group,  ScrollAreaAutosize, Accordion, ScrollArea, Flex, Divider, useMantineTheme } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { FaLock } from "react-icons/fa";


export const ChallengeContext = createContext<any>(null);

export default function ChallengesTab({ active }: { active: string | null }) {
	const { allTeamsChallengeData, } = useContext(ChallengeDeckContext)
	const props = useContext(GameContext);
	const moves = props.moves as ConnectFourMoves; //TODO: Make this generic / composite
	const { allPlayersData } = props.G;
	const playerData = allPlayersData[props.playerData.data.playerID];
	const myTeam = playerData.teamColor;
	// endGame empties hands, but matches ended before that change still hold cards.
	const challengeHand = props.G.gameOver ? [] : allTeamsChallengeData[myTeam]?.challengeHand;
	const challengeDeck = allTeamsChallengeData[myTeam]?.challengeDeck;
	const [opened, { open, close }] = useDisclosure(false);
	const [currentChallenge, setCurrentChallenge] = useState("");
	const theme = useMantineTheme()
	if (!challengeHand) {
		return <h1>No challenges available</h1>;
	}
	function handleDiscardHand() {
		console.log("discarding hand");
		moves.discardHand();
	}

	const { setTabAlertState } = useContext(TabAlertsContext)

	// G is replaced on every server update, so challengeHand always has a new
	// reference. Compare titles to detect actual draws and ignore re-renders
	// caused by unrelated state changes.
	const previousHandTitles = useRef<string[] | undefined>(undefined);
	useEffect(() => {
		const currentTitles = challengeHand?.map(c => c.title) ?? [];
		const previous = previousHandTitles.current;
		previousHandTitles.current = currentTitles;
		if (previous === undefined) return; // first render — don't fire
		const previousSet = new Set(previous);
		const hasNew = currentTitles.some(title => !previousSet.has(title));
		if (hasNew) {
			setTabAlertState(oldValues => ({ ...oldValues, "challenges": true }));
		}
	}, [challengeHand]);

	useEffect(() => {
		if (active !== "Challenges") return
		console.log("challenges tab activated!");
		setTabAlertState(oldValues => { return { ...oldValues, "challenges": false } });
	}, [active]);

	return (
		<>
			<Box style={{ zIndex: 10 }}>
				<ComplexHeader>
					<Container w="100%">
						<Stack gap="0" ta="center" align="stretch" w="100%">
							{/* <h1>Challenges</h1> */}
							<Group justify="center" m="xs">
								<Span fz="sm">
									{challengeDeck.length} challenges in deck
								</Span>
								{actionsLocked(props.G) ? null :
									<ConfirmButton action={handleDiscardHand} description="discard all your challenges" display="inline-block" size="xs">
										Discard Hand
									</ConfirmButton>}
							</Group>
						</Stack>
					</Container>
				</ComplexHeader>
			</Box>
			<ScrollArea>
				<Container mih="0" w="100%">
					<Stack className="challengeButtonStack" pb="md" pt="md" w="100%" h="100%" justify="center" >
						<ChallengeContext value={{ open, setCurrentChallenge }}>
							<Accordion variant="separated">
								{challengeHand.map((challenge, index) => {
									return (
										// <ChallengeCard key={index} teamColor={theme.primaryColor} onClick={() => {
										// 	setCurrentChallenge(challenge.title);
										// 	console.log("opening modal");
										// 	open();
										// }
										// } challenge={challenge}></ChallengeCard>
										// <ChallengeButton challenge={challenge} key={index} team={theme.primaryColor} claimButton={true} />
										<Accordion.Item
											
											bd={challenge.hard ? `2px solid ${theme.primaryColor}` : `1.5px dashed ${theme.primaryColor}`}
											style={{
												borderRadius: "10px"
											}}
											bg={"white"}
											key={index}
											value={challenge.title} >
											<Accordion.Control icon={challenge.emoji}><P fw="bold" tt="uppercase" className="mono" pb={0}>{challenge.title}</P></Accordion.Control>
											<Accordion.Panel>
												<ChallengeBody teamColor={theme.primaryColor} challenge={challenge}></ChallengeBody>
												<ClaimButton title={challenge.title} />

											</Accordion.Panel>
										</Accordion.Item>
									);
								})}
							</Accordion>
						</ChallengeContext>
					</Stack>
				</Container>
			</ScrollArea>
			<ClaimFlowModal
				open={opened}
				close={close}
				challengeTitle={currentChallenge}
				inferZone={true}
			/>
		</>
	);
}