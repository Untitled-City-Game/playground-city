import { ChallengeDeck } from "@/scripts/games/challenge_deck/challenge_deck_types";
import { ConnectFourMoves } from "@/scripts/games/connect_four/connect_four";
import { ConnectFourGameState } from "@/scripts/games/connect_four/types";
import { SnakeGameState } from "@/scripts/games/snake/types";
import { GameBoardContext, GameBoardContextSpecific, GameStateGeneric, LocationData, LocationResult, PlayerData } from "@/scripts/types/types";
import useMyLocation from "@/src/match/interfaces/useMyLocation";
import useTeamLocations from "@/src/match/interfaces/useTeamLocations";
import Loading from "@/src/match/screens/game_status/Loading";
import OtherTeamClaimModal from "@/src/match/screens/game_status/OtherTeamClaimModal";
import VictoryModal from "@/src/match/screens/game_status/VictoryModal";
import Waiting from "@/src/match/screens/game_status/Waiting";
import TabSet from "@/src/match/screens/match_tabs/TabSet";
import { ReviewContext } from "@/src/review/ReviewContext";
import ErrorDialog from "@/src/site/errorHandling/ErrorDialog";
import StatusBar from "@/src/userInterface/StatusBar";
import { createContext, RefObject, useContext, useEffect, useMemo, useRef } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useLocation, useNavigate } from "react-router";


export const GameContext = createContext({} as GameBoardContext);

export function ConnectFourBoard(props: GameBoardContextSpecific<ConnectFourGameState>) {
    return Board(props)
}

export function SnakeBoard(props: GameBoardContextSpecific<SnakeGameState>) {
    return Board(props)
}

function Board(props: GameBoardContext) {
    const playerID = props.playerID;
    const moves = props.moves as ConnectFourMoves
    const playerData = props.playerData;
    let navigate = useNavigate();

    const contextValue = useMemo(() => ({ ...props }), [props.G, props.ctx, props.log, props.playerID, props.moves, props.playerData, props.credentials]);

    useEffect(() => {
        if (playerID && props.G.allPlayersData && !props.G.allPlayersData[playerID]) {
            console.log(
                "setting up player ",
                playerID,
                playerData,
                "on client"
            );
            moves.playerSetup(playerData.data);
        }
    }, [playerID, moves, playerData, props.G.allPlayersData]);

    if (!playerID) {
        navigate("/lobby");
    }

    if (!props.G.active) {
        return (
            <GameContext.Provider value={contextValue}>
                <LocationRefContextWrapper>
                    <MatchContext G={props.G}>
                        <Waiting />
                    </MatchContext>
                </LocationRefContextWrapper>
            </GameContext.Provider>
        );
    }

    if (playerID && !props.G.allPlayersData[playerID]) {
        return <Loading message="Looking for local player data" />;
    }

    return (
        <GameContext.Provider value={contextValue}>
            <ErrorBoundary
                FallbackComponent={ErrorDialog}>
                <OtherTeamsContextWrapper matchID={props.matchID}>
                    <LocationRefContextWrapper>
                        <MatchContext G={props.G}>
                            <MatchGameplay G={props.G} playerData={props.playerData.data} />
                        </MatchContext>
                    </LocationRefContextWrapper>
                </OtherTeamsContextWrapper>
            </ErrorBoundary>
        </GameContext.Provider>
    );
}

function MatchGameplay({ G, playerData }: { G: GameStateGeneric, playerData: PlayerData }) {
    switch (G.gameCode) {
        case "connect_four":
            return ConnectFourGameplay(G, playerData)
        case "snake":
            return SnakeGameplay(G, playerData)
    }
}
function MatchContext({ G, children }: { G: GameStateGeneric, children: React.ReactNode }) {
    switch (G.gameCode) {
        case "connect_four":
            return <ConnectFourContextWrapper G={G}>{children}</ConnectFourContextWrapper>
        case "snake":
            return <SnakeContextWrapper G={G}>{children}</SnakeContextWrapper>
    }
}

export const SnakeContext = createContext({} as SnakeGameState);
export const ConnectFourContext = createContext({} as ConnectFourGameState);
export const ChallengeDeckContext = createContext({} as ChallengeDeck)

function ConnectFourContextWrapper({ G, children }: { G: ConnectFourGameState, children: React.ReactNode }) {
    return (
        <ConnectFourContext.Provider value={G}>
            <ChallengeDeckContext.Provider value={{ challengeDeck: G.challengeDeck, allTeamsChallengeData: G.allTeamsChallengeData }}>
                {children}
            </ChallengeDeckContext.Provider>
        </ConnectFourContext.Provider>
    )
}

function ConnectFourGameplay(G: ConnectFourGameState, playerData: PlayerData) {
    const claimedZones = G.zoneData.filter(zone => zone.controlTeam === playerData.teamColor).length
    return (
        <>
            <StatusBar>
                {claimedZones} neighbourhood{claimedZones === 1 ? "" : "s"} claimed
                <VictoryModal />
                <OtherTeamClaimModal />
            </StatusBar>
            <TabSet tabCodes={["challenges", "connect_four_map", "log"]} />
        </>
    )
}

function SnakeContextWrapper({ G, children }: { G: SnakeGameState, children: React.ReactNode }) {
    return (
        <SnakeContext.Provider value={G}>
            {children}
        </SnakeContext.Provider>

    )
}

function SnakeGameplay(G: SnakeGameState, playerData: PlayerData) {
    console.log("snake game state", G, playerData)
    const snakeLength = G.snakeTeamData[playerData.teamColor]?.snakeBody.maxLength
    return (
        <>
            <StatusBar>
                Snake length: {snakeLength}m
            </StatusBar>
            <TabSet tabCodes={["snake_map", "snake_data", "log"]} />
        </>
    )

}


export const OtherTeamsContext = createContext<LocationData[]>([])

function OtherTeamsContextWrapper({ children, matchID }: { children: React.ReactNode, matchID: string }) {
    // Reviewing a past match: no live locations, and no location server
    if (useContext(ReviewContext)) {
        return <OtherTeamsContext.Provider value={[]}>{children}</OtherTeamsContext.Provider>
    }
    return <LiveOtherTeams matchID={matchID}>{children}</LiveOtherTeams>
}

function LiveOtherTeams({ children, matchID }: { children: React.ReactNode, matchID: string }) {
    const data = useTeamLocations(matchID)
    return (
        <OtherTeamsContext.Provider value={data}>
            {children}
        </OtherTeamsContext.Provider>
    )
}

export const LocationContext = createContext<RefObject<LocationResult> | undefined>(undefined)

function LocationRefContextWrapper({ children }: { children: React.ReactNode }) {
    const location = useMyLocation();
    const locationRef = useRef(location);
    useEffect(() => {
        locationRef.current = location;
    }, [location])
    return (
        <LocationContext value={locationRef}>
            {children}
        </LocationContext>
    )
}