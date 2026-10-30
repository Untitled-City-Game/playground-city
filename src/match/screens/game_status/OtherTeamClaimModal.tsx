import { ConnectFourGameState } from "@/scripts/games/connect_four/types";
import { LogMetadata } from "@/scripts/types/types";
import { ConnectFourContext, GameContext } from "@/src/match/Board";
import { ChallengeButton } from "@/src/match/screens/match_tabs/challenges/UI/ChallengePopup";
import { ChallengeEvidence, ClaimChallengeCompleted } from "@/src/match/screens/match_tabs/game_log/messages/ChallengeCompleted";
import P from "@/src/userInterface/P";
import TeamColorModal from "@/src/match/screens/game_status/TeamColorModal";
import { VictoryMessage } from "@/src/match/screens/game_status/VictoryModal";
import { Box, Divider, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { LogEntry } from "boardgame.io";
import { useContext, useEffect, useRef, useState } from "react";

export default function OtherTeamClaimModal() {
    const props = useContext(GameContext);
    const G = useContext(ConnectFourContext) as ConnectFourGameState;
    const playerData = props.playerData.data;
    // Start at current log length so existing entries on join don't pop up.
    const lastSeenLength = useRef(props.log.length);
    const [opened, { open, close }] = useDisclosure(false);
    const [entry, setEntry] = useState<LogEntry | undefined>();
    // Victory is set in the same move as the winning claim, so a victory that
    // appears alongside a claim means that claim won the game.
    const lastSeenVictory = useRef(props.G.victory);
    const [winningClaim, setWinningClaim] = useState(false);

    useEffect(() => {
        const victoryIsNew = props.G.victory !== undefined && lastSeenVictory.current === undefined;
        lastSeenVictory.current = props.G.victory;
        // The log only shrinks when reviewing a match and stepping back; catch
        // up so stepping forward again shows the popups again.
        if (props.log.length < lastSeenLength.current) lastSeenLength.current = props.log.length;
        if (props.log.length <= lastSeenLength.current) return;
        const newEntries = props.log.slice(lastSeenLength.current);
        lastSeenLength.current = props.log.length;
        // Most recent qualifying entry in this batch wins, so a fast burst of
        // claims still surfaces the latest one.
        const claim = [...newEntries].reverse().find(e => {
            if (e.action.payload.type !== "completeChallengeAndClaim") return false;
            const senderTeam = props.G.allPlayersData[e.action.payload.playerID]?.teamColor;
            return senderTeam && senderTeam !== playerData.teamColor;
        });
        if (claim) {
            setEntry(claim);
            setWinningClaim(victoryIsNew && (claim.metadata as LogMetadata).team === props.G.victory);
            open();
        }
    }, [props.log, props.G.victory]);

    if (!entry) return null;
    const metadata = entry.metadata as LogMetadata;
    const challenge = G.challengeDeck?.find(c => c.title === metadata.challenge);

    return (
        <TeamColorModal
            opened={opened}
            onClose={close}
            team={metadata.team}
            title={winningClaim ? "Winner!" : "Neighbourhood Claimed!"}>
            <Stack gap="sm">
                {winningClaim && props.G.victory ? (
                    <>
                        <Box>
                            <VictoryMessage team={props.G.victory} />
                        </Box>
                        <Divider color={metadata.team} />
                    </>
                ) : null}
                <P>
                    <ClaimChallengeCompleted metadata={metadata} />
                </P>
                {challenge ? (
                    <ChallengeButton
                        team={metadata.team}
                        challenge={challenge}
                        completed={true}
                        claimButton={false}
                    />
                ) : null}
                <ChallengeEvidence metadata={metadata} />
            </Stack>
        </TeamColorModal>
    );
}
