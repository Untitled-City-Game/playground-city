//Set of button links to choose game from list in consts.ts. Games not enabled in this environment are marked "coming soon". Choosing a game will redirect to the choose match page.
import { games, isGameEnabled } from "@/scripts/consts";
import useWindowDimensions from "@/scripts/useWindowDimensions";
import { Container, Stack, Text } from "@mantine/core";
import { Link } from "react-router";
import { ListButton } from "../userInterface/ListButton";
import { useGeolocated } from "react-geolocated";

export default function ChooseGame() {
	const gameListItems = games.map((game, index) => {
		const enabled = isGameEnabled(game);
		return (
			<ListButton
				key={index}
				component={enabled ? Link : undefined}
				to={`/lobby/${game.code}/choose-match`}
				color={enabled ? game.color : "gray"}
				>
				<game.icon color={enabled ? `var(--mantine-color-${game.color}-7` : "gray"} size={60} />
				<Container p="0">
					<h3>{game.name}</h3>
					<Text fs="italic">{enabled ? "" : "Coming soon"}</Text>
					<Text fz="sm">{game.description}</Text>
				</Container>
			</ListButton>
		);
	});

    const { coords, isGeolocationAvailable, isGeolocationEnabled } = useGeolocated({
            positionOptions: {
                enableHighAccuracy: false,
            },
            userDecisionTimeout: 5000,
        });
		return (
			<Stack
				maw="500px"
			>
				<h2>Choose a game</h2>
				{/* <div>{isGeolocationAvailable ? "location available" : "location not available"}</div>
				<div>{isGeolocationEnabled ? "location enabled" : "location not enabled"}</div> */}
				{gameListItems}
				
			</Stack>
	);
}
