import { PlayerData } from "@/scripts/types/types";
import Button from "@/src/userInterface/CustomButton";
import P from "@/src/userInterface/P";
import Span from "@/src/userInterface/Span";
import { Box, Stack } from "@mantine/core";
import { FaExternalLinkSquareAlt } from "react-icons/fa";
import { Link } from "react-router";

const PLAYTEST_FEEDBACK_URL = "https://forms.gle/JR8F3LuE7PsYYp6E8";

export function GameEnded({ senderData }: { senderData: PlayerData; }) {
	return (
		<Stack gap="xs">
			<P mb="0">
				<Span fw="bold">{senderData.name}</Span> ended the game.
			</P>
			<P mb="0">Photos and videos in the log will be available for 24 hours, then deleted.</P>
			<P mb="0">Thanks for playtesting! We'd love to hear how it went — it only takes a few minutes.</P>
			<Button size="xs" component="a" target="_blank" rel="noopener noreferrer" href={PLAYTEST_FEEDBACK_URL}>
				Give playtest feedback<Box m="0" ml={3}><FaExternalLinkSquareAlt /></Box>
			</Button>
			<Button size="xs" variant="outline" component={Link} to="/">Join another game</Button>
		</Stack>
	);
}
