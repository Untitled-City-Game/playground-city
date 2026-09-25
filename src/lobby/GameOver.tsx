import { GameContext } from "@/src/match/Board";
import Button from "@/src/userInterface/CustomButton";
import P from "@/src/userInterface/P";
import { Box, Center, Container, Stack } from "@mantine/core";
import { useContext } from "react";
import { FaExternalLinkSquareAlt } from "react-icons/fa";
import { Link } from "react-router";

const PLAYTEST_FEEDBACK_URL = "https://forms.gle/JR8F3LuE7PsYYp6E8";

export default function GameOver(){
	const props = useContext(GameContext);
	return (
	<Container>
		<Center>
			<Stack>
				<h1>This game has ended</h1>
					<P>Thanks for playtesting! We'd love to hear how it went — it only takes a few minutes.</P>
					<Button component="a" target="_blank" rel="noopener noreferrer" href={PLAYTEST_FEEDBACK_URL}>
						Give playtest feedback<Box m="0" ml={3}><FaExternalLinkSquareAlt /></Box>
					</Button>
					<Button variant="outline" component={Link} to="/">Join another game</Button>
			</Stack>
		</Center>
	</Container>
	)
}
