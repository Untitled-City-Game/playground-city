import { theme } from "@/src/styles/theme";
import HelpIcon from "@/src/match/components/help/HelpButton";
import SettingsIcon from "@/src/match/components/help/SettingsButton";
import MapLayersIcon from "@/src/match/components/help/MapLayersButton";
import { Center, Group } from "@mantine/core";
import { useContext } from "react";
import Countdown from 'react-countdown';
import Span from "./Span";
import { GameContext } from "@/src/match/Board";
import { ReviewContext } from "@/src/review/ReviewContext";

export default function StatusBar({ children }: { children?: React.ReactNode }) {
    const { G } = useContext(GameContext);
    // Reviewing: the clock stands still at the time of the step shown
    const review = useContext(ReviewContext);
    return (
        <Center style={statusBarStyles} className="header">
            <Group justify="center" align="center" wrap="nowrap">
                <Span size="xs">{children}</Span>
                {G.pausedAt !== undefined ?
                    <Span size="xs" fw="bold">Paused: {formatRemaining((G.endTime || 0) - G.pausedAt)} remaining</Span> :
                    review ?
                    <Span size="xs">{formatRemaining((G.endTime || 0) - review.now)} remaining</Span> :
                    <Span size="xs"><Countdown
                        date={new Date(G.endTime || 0)}
                        renderer={
                            props => <span>{formatRemaining(props.total)}</span>
                        }
                    /> remaining</Span>}
                <HelpIcon />
                <MapLayersIcon />
                <SettingsIcon />
            </Group>
        </Center>
    );
}

// Hours and minutes, or minutes and seconds in the last hour, e.g. "2h 15m"
// or "42m 07s". Used by the live countdown and the paused/review timers.
function formatRemaining(ms: number) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor(totalSeconds / 60) % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}m ${seconds}s`;
}

const statusBarStyles = {
    position: "sticky" as const,
    backgroundColor: theme.white,
    width: "100%",
    zIndex: 1,
    padding: "0.4rem",
};