import { ZoneData } from "@/scripts/games/connect_four/types";
import { actionsLocked } from "@/scripts/games/shared_moves/manageGame";
import { LineData } from "@/scripts/types/googleMaps";
import { ConnectFourContext, GameContext } from "@/src/match/Board";
import ClaimFlowModal, { isZoneDisabled } from "@/src/match/components/regions/region_claim_flow/ClaimFlowModal";
import Button from "@/src/userInterface/CustomButton";
import P from "@/src/userInterface/P";
import Span from "@/src/userInterface/Span";
import { Box, Center, CloseButton, Container, Flex, Group, Stack, useMantineTheme } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import React, { Dispatch, SetStateAction, useContext, useEffect } from "react";
import { FaArrowCircleLeft, FaArrowCircleRight, FaCircle, FaGripLinesVertical, FaRegCircle } from "react-icons/fa";

export default function SelectedZonePopup({
    currentZone,
    setCurrentZone,
    activeLine,
    setActiveLine
}: {
    currentZone: ZoneData | undefined;
    setCurrentZone: Dispatch<SetStateAction<ZoneData | undefined>>;
    activeLine: LineData | undefined;
    setActiveLine: Dispatch<SetStateAction<LineData | undefined>>;
}) {
    const theme = useMantineTheme();
    const [opened, { open, close }] = useDisclosure(false);
    const props = useContext(GameContext)
    const G = useContext(ConnectFourContext);
    const winningLines = G.MatchMapData.winningLines;
    const disabled = currentZone ? isZoneDisabled(currentZone.name, G) : false
    const lines = winningLines.filter(line => line.matchedPolygons.includes(currentZone?.name || ""))

    function deselect() {
        setCurrentZone(undefined);
        setActiveLine(undefined);
    }
    // Derived from activeLine rather than held in state, so it stays in sync
    // when the parent resets activeLine on a zone change.
    const lineIndex = Math.max(0, lines.findIndex(line => activeLine && isSameLine(line, activeLine)));
    function nextLine() {
        setActiveLine(lines[(lineIndex + 1) % lines.length])
    }
    function prevLine() {
        setActiveLine(lines[(lineIndex - 1 + lines.length) % lines.length])
    }
    useEffect(() => {
        if (activeLine === undefined) { setActiveLine(lines[0]); }
    }, [lines])
    const ownerColor = currentZone?.controlTeam ? theme.colors[currentZone.controlTeam][5] : undefined
    return (
        <>
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    zIndex: 1,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "white",
                    borderBottom: `3px solid ${theme.colors.actionColor[5]}`,
                    padding: "0.25rem 0.5rem",
                    transform: currentZone ? "translateY(0)" : "translateY(-100%)",
                    transition: "transform 200ms ease",
                    pointerEvents: currentZone ? "auto" : "none",
                }}
            >
                <button
                    onClick={prevLine}
                    style={lineNavButtonStyles(theme.colors.violet[8])}
                    aria-label="Previous line"
                >
                    <FaArrowCircleLeft size="2rem" />
                </button>
                <Span size="sm">
                    {lines.length > 0 ? `Line ${lineIndex + 1} of ${lines.length}` : "No lines"}
                </Span>
                <button
                    onClick={nextLine}
                    style={lineNavButtonStyles(theme.colors.violet[8])}
                    aria-label="Next line"
                >
                    <FaArrowCircleRight size="2rem" />
                </button>
            </div>

            <Center
                style={{
                    borderTop: `3px solid ${ownerColor || theme.colors.actionColor[5]}`,
                    ...selectedZonePopupStyles,
                    transform: currentZone ? "translateY(0)" : "translateY(100%)",
                    transition: "transform 200ms ease",
                    pointerEvents: currentZone ? "auto" : "none",
                }}
            >


                <Center
                    style={{
                        flexGrow: "2",
                        padding: "3px"
                    }}
                >
                    {/* <CloseButton
                            style={{
                                position: "relative",
                                left: "1rem",
                            }}
                            onClick={deselect}
                        /> */}
                    <Stack gap="xs" w="100%" align="stretch">
                        <P>
                            <Span style={{
                                margin: 0,
                                padding: 0,
                                fontWeight: "bold"
                            }}>{currentZone?.name} </Span>
                            <Span style={{
                                margin: 0,
                                padding: 0
                            }}>{
                                    currentZone?.controlTeam !== null ?
                                        `${currentZone?.locked ?
                                            "Locked" :
                                            "Held"
                                        } by ${currentZone?.controlTeam} team` :
                                        "Unclaimed"
                                }</Span>
                        </P>
                        {G.gameOver ?
                            <P>
                                The game has ended.
                            </P> : G.pausedAt !== undefined ?
                            <P>
                                The game is paused.
                            </P> : disabled ?
                            <P>
                                You can't claim the starting neighbourhood first.
                            </P> : null}
                        <Button
                            color={ownerColor}
                            onClick={() => {
                                open();
                                deselect();
                            }} size="m" disabled={currentZone?.locked || disabled || actionsLocked(G)}>
                            <span>{currentZone?.controlTeam === null ? "Claim" : currentZone?.controlTeam === props.playerData.data.teamColor ? "Lock" : "Steal"}</span>
                        </Button>
                    </Stack>
                </Center>
            </Center>
            <ClaimFlowModal
                open={opened}
                close={close}
                claimedZone={currentZone}
            />
        </>
    );
}

const selectedZonePopupStyles: React.CSSProperties = {
    zIndex: 1,
    position: "fixed",
    bottom: 0,
    width: "100%",
    backgroundColor: "white",
    textAlign: "center",
    padding: "0.5rem 1rem",
};

// Match by content, not identity: synced game state can hand us fresh objects,
// and line names from KML aren't guaranteed unique.
function isSameLine(a: LineData, b: LineData) {
    return a === b || (a.featureName === b.featureName && a.matchedPolygons.join() === b.matchedPolygons.join());
}

const lineNavButtonStyles = (color: string): React.CSSProperties => ({
    background: "none",
    border: "none",
    padding: "0.25rem 0.5rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    color,
});
