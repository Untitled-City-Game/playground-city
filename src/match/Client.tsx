import { games } from "@/scripts/consts";
import { ConnectFour } from "@/scripts/games/connect_four/connect_four";
import { Snake } from "@/scripts/games/snake/snake";
import type { ClientSetupData, GameMeta, PlayerData } from "@/scripts/types/types";
import { ConnectFourBoard, SnakeBoard } from "@/src/match/Board";
import Loading from "@/src/match/screens/game_status/Loading";
import { theme } from "@/src/styles/theme";
import { MantineProvider, mergeMantineTheme, useMantineTheme } from "@mantine/core";
import { SocketIO } from "boardgame.io/multiplayer";
import { Client } from "boardgame.io/react";
import { useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useNavigate } from "react-router";

export default function MatchClient() {
	const [playerData, setPlayerData] = useState<PlayerData>();
	const navigate = useNavigate();
	//Check if session is already part of a game
	useEffect(() => {
		console.log("running localstorage playerdata effect");
		if (!playerData) {
			const localPlayerData = localStorage.getItem("localPlayerData");
			if (localPlayerData) {
				const loadedPlayerData = JSON.parse(
					localPlayerData
				) as PlayerData;
				console.log(
					"setting player data from local storage",
					localPlayerData
				);
				setPlayerData(loadedPlayerData);
			} else {
				console.log("no player data in local storage");
				navigate("/lobby");
			}
		}
	}, [playerData]);

	// Create match client
	if (playerData) {
		const GameClient = createGame(playerData)
		const clientTheme = matchTheme(playerData.gameCode);

		return (
			<MantineProvider theme={clientTheme}>
				<ErrorBoundary
					fallback={
						<span>Something went wrong with the game client.</span>
					}>
					<GameClient
						matchID={playerData.matchID || "default"}
						gameCode={playerData.gameCode || "default"}
						playerData={{ data: playerData, setter: setPlayerData }}
						credentials={playerData.playerCredentials}
						playerID={playerData.playerID}
					/>
				</ErrorBoundary>
			</MantineProvider>
		);
	} else {
		console.log("no player data");
		return <>No player data found.</>;
	}
}

// The game's colour scheme, shared with the /review screen.
export function matchTheme(gameCode: string | undefined) {
	const game : GameMeta | undefined = games.find((game) => game.code === gameCode);
	return mergeMantineTheme(theme, {
		primaryColor: game?.color,
		colors: {
			...theme.colors,
			actionColor: game ? theme.colors[game.color] : theme.colors.actionColor,
		}
	});
}

function createGame(playerData: PlayerData) {
	switch(playerData.gameCode){
		case "connect_four":
			return Client({
			game: ConnectFour,
			board: ConnectFourBoard,
			debug: false,
			multiplayer: SocketIO({
				server: process.env.GAME_SERVER,
			}),
			loading: Loading,
		}) as React.JSXElementConstructor<ClientSetupData>;
		case "snake":
			return Client({
			game: Snake,
			board: SnakeBoard,
			debug: false,
			multiplayer: SocketIO({
				server: process.env.GAME_SERVER,
			}),
			loading: Loading,
		}) as React.JSXElementConstructor<ClientSetupData>;
		default:
			throw new Error("invalid game code on clientcontainer")
	}
}

