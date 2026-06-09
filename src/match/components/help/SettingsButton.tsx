import { games } from "@/scripts/consts";
import { SharedMoves } from "@/scripts/games/shared_moves/sharedMoves";
import { GameContext } from "@/src/match/Board";
import { GameInviteButton } from "@/src/match/screens/game_status/Waiting";
import ConfirmButton from "@/src/userInterface/ConfirmModal";
import P from "@/src/userInterface/P";
import { Anchor, Center, Group, Modal, Stack, UnstyledButton } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useContext } from "react";
import { BsFillGearFill } from "react-icons/bs";

export default function SettingsIcon() {
	const [opened, { open, close }] = useDisclosure(false);
	
	return (
		<>
			<SettingsModal opened={opened} close={close} />
			<UnstyledButton onClick={open}>
				<Center>
					<BsFillGearFill size={20} />
				</Center>
			</UnstyledButton>
		</>
	);
}


export function SettingsModal({
	opened,
	close,
}: {
	opened: boolean;
	close: () => void;
}) {
	const props = useContext(GameContext);
	const moves = props.moves as SharedMoves;
	const game = games.find((game) => game.code === props.gameCode);
	const playerData = props.G.allPlayersData;
	async function handleEndGame() {
		console.log("ending game");
		moves.endGame();
	}
	return (
		<Modal
			opened={opened}
			onClose={close}
			title={
				<span style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
					Settings
				</span>
			}>
			<P><strong>Host: </strong> {playerData[0]?.name}</P>
			<p><strong>Invite code: </strong>{props.matchID}</p>
			<Stack>
			<GameInviteButton gameCode={props.gameCode} matchID={props.matchID} />
			{props.playerData.data.admin ?
				<ConfirmButton variant="outline" description="undo" action={() => props.moves.customUndo()}>
					Undo last action
				</ConfirmButton>
				: null}
			{props.playerData.data.admin ? <ConfirmButton action={handleEndGame} description="end the game">End Game</ConfirmButton> : null}
			{process.env.BUG_REPORT ?
				<Anchor href={process.env.BUG_REPORT} target="_blank" rel="noopener noreferrer" size="sm" c="dimmed">
					Report a bug
				</Anchor>
				: null}
				</Stack>
		</Modal>
	);
}
