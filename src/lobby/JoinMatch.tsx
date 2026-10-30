import {  LoadingOverlay, Radio, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { LobbyAPI } from "boardgame.io";
import { LobbyClient } from "boardgame.io/client";
import { Navigate, useNavigate, useParams } from "react-router";

import { games } from "@/scripts/consts";
import { joinMatch } from "@/scripts/joinMatch";
import { NamedColor, PlayerData } from "@/scripts/types/types";
import Loading from "@/src/match/screens/game_status/Loading";
import P from "@/src/userInterface/P";
import { useEffect, useMemo, useState } from "react";
import { ListButton } from "../userInterface/ListButton";
import SafariWarning from "@/src/site/SafariWarning";
import Button from "@/src/userInterface/CustomButton";

export default function JoinMatch() {
	const { matchID, gameCode } = useParams();
	// Already in this match on this browser: skip the form and go straight back in
	if (matchID && gameCode && isStoredMatch(matchID, gameCode)) {
		return <Navigate to="/match" replace />;
	}
	return <JoinMatchForm />;
}

// The player saved by joining or creating a match, which /match plays as
function isStoredMatch(matchID: string, gameCode: string) {
	try {
		const stored = JSON.parse(localStorage.getItem("localPlayerData") ?? "null") as PlayerData | null;
		return stored?.matchID === matchID && stored?.gameCode === gameCode;
	} catch {
		return false;
	}
}

function JoinMatchForm() {
	const matchID = useParams().matchID;
	const gameCode = useParams().gameCode;
	const [loading, setLoading] = useState(false);
	if (!matchID || !gameCode) {
		throw new Error("Invalid match ID or game code");
	}
	const game = games.find((game) => game.code === gameCode);

	const lobbyClient = useMemo(
		() => new LobbyClient({ server: process.env.GAME_SERVER }),
		[]
	);

	let navigate = useNavigate();

	//get match data
	const [matchData, setMatchData] = useState<LobbyAPI.Match>();
	useEffect(() => {
		lobbyClient.getMatch(gameCode, matchID).then((res) => {
			setMatchData(res);
		});
	}, [matchID, lobbyClient]);

	const joinGameForm = useForm({
		mode: "uncontrolled",
		initialValues: {
			PlayerName: "",
			teamColor: "" as NamedColor,
		},
		validate: {
			PlayerName: (value) =>
				value.length > 0 ? null : "Player name is required",
			teamColor: (value) =>
				value.length > 0 ? null : "Team is required",
		},
	});

	type FormValues = {
		PlayerName: string;
		teamColor: NamedColor;
	};
	const handleJoinGame = async (values: FormValues) => {
		setLoading(true);
		console.log(values);
		console.warn("looking for player", values.PlayerName)
		const existingPlayer = matchData?.players.find(player => player.name === values.PlayerName);
		let playerData : PlayerData
		if (existingPlayer && existingPlayer.name && existingPlayer.data.teamColor) {
			console.warn("Player already exists in the match");
			playerData = {
				playerID: `${Number(existingPlayer.id)}`,
				name: existingPlayer.name,
				matchID,
				gameCode,
				teamColor: existingPlayer.data.teamColor,
				admin: existingPlayer.id === 0
			}
		} else {
			playerData = await joinMatch(
				lobbyClient,
				gameCode,
				matchID,
				values.PlayerName,
				values.teamColor
			);
		}
		localStorage.setItem("localPlayerData", JSON.stringify(playerData));
		navigate("/match");
	};

	if (matchData) {
		const teamMembers = sortTeamPlayers(matchData);

		const teamOptions = [
			{ label: "Red", value: "red", members: teamMembers?.red },
			{ label: "Blue", value: "blue", members: teamMembers?.blue },
		];
		//Render radio options for teams
		const teamCards = teamOptions.map((item) => (
			<ListButton
				component={Radio.Card}
				value={item.value}
				key={item.value}
				color={item.value}>
				<Radio.Indicator
					color={item.value}
					iconColor="white"
					size="lg"
				/>
				<div>
					<P>{item.label}</P>
					<P>
						{item.members?.length
							? `Members: ${item.members.join(", ")}`
							: "None"}
					</P>
				</div>
			</ListButton>
		));
		return (
			<>
				<LoadingOverlay visible={loading} loaderProps={{ children: <Loading message="Joining match..." /> }} />
				<SafariWarning />
				<h1>{matchData.setupData.gameName}</h1>

				<Stack gap={0} mb="sm">
					<span><strong>Host:</strong> {matchData.players[0].name}</span>
					<span><strong>Match ID:</strong> {matchID}</span>
				</Stack>
				<Stack>
				<form
					onSubmit={joinGameForm.onSubmit(handleJoinGame)}
					id="joingame">
					<TextInput
						label="Your name"
						key={joinGameForm.key("PlayerName")}
						{...joinGameForm.getInputProps("PlayerName")}
					/>
					<P fs="italic" fz="xs">To rejoin, enter the same name you used to join the game.</P>
					<Radio.Group
						pt="md"
						label="Choose a team"
						key={joinGameForm.key("teamColor")}
						{...joinGameForm.getInputProps("teamColor")}>
						<Stack gap="xs">{teamCards}</Stack>
					</Radio.Group>
				</form>
				<Button type="submit" form="joingame">
					Join Game
				</Button>
				</Stack>
			</>
		);
	}

	return <Loading message="Loading..." />;
}

function sortTeamPlayers(matchData: LobbyAPI.Match | undefined) {
	if (!matchData) {
		return undefined;
	}
	const teamsAndPlayers: Record<string, string[]> = {
		red: [],
		blue: [],
	};
	matchData.players.forEach((player) => {
		console.log("playerdata", player);
		if (
			player.name &&
			player.data &&
			typeof player.data.teamColor === "string"
		) {
			if (player.data.teamColor in teamsAndPlayers) {
				teamsAndPlayers[player.data.teamColor].push(player.name);
			} else {
				teamsAndPlayers[player.data.teamColor] = [player.name];
			}
		}
	});
	return teamsAndPlayers;
}
