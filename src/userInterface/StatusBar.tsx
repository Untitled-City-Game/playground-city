import { theme } from "@/src/styles/theme";
import HelpIcon from "@/src/match/components/help/HelpButton";
import SettingsIcon from "@/src/match/components/help/SettingsButton";
import MapLayersIcon from "@/src/match/components/help/MapLayersButton";
import { Center, Group } from "@mantine/core";
import { useContext } from "react";
import Countdown from 'react-countdown';
import Span from "./Span";
import { GameContext } from "@/src/match/Board";

export default function StatusBar({ children }: { children?: React.ReactNode }) {
    const { G } = useContext(GameContext);
    return (
        <Center style={statusBarStyles} className="header">
            <Group justify="center" align="center" wrap="nowrap">
                <Span size="xs">{children}</Span>
                <Span size="xs"><Countdown
                    date={new Date(G.endTime || 0)}
                    renderer={
                        props => <span>{props.hours}h {props.minutes}m</span>
                    }
                /> remaining</Span>
                <HelpIcon />
                <MapLayersIcon />
                <SettingsIcon />
            </Group>
        </Center>
    );
}

const statusBarStyles = {
    position: "sticky" as const,
    backgroundColor: theme.white,
    width: "100%",
    zIndex: 1,
    padding: "0.4rem",
};