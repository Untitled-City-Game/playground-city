import { games } from "@/scripts/consts";
import { SharedMoves } from "@/scripts/games/shared_moves/sharedMoves";
import { GameContext } from "@/src/match/Board";
import { GameInviteButton } from "@/src/match/screens/game_status/Waiting";
import Button from "@/src/userInterface/CustomButton";
import ConfirmButton, { CloseWithConfirm } from "@/src/userInterface/ConfirmModal";
import P from "@/src/userInterface/P";
import { ReviewControlsContext } from "@/src/review/ReviewContext";
import { ActionIcon, Alert, Anchor, Center, Divider, Group, Modal, Select, Stack, UnstyledButton } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useContext } from "react";
import { BsFillGearFill } from "react-icons/bs";
import { FaFastBackward, FaFastForward, FaStepBackward, FaStepForward } from "react-icons/fa";

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
			<CloseWithConfirm close={close}>
			<ReviewSection />
			<P><strong>Host: </strong> {playerData[0]?.name}</P>
			<p><strong>Invite code: </strong>{props.matchID}</p>
			<Stack>
			<GameInviteButton gameCode={props.gameCode} matchID={props.matchID} />
			{props.playerData.data.admin ?
				<ConfirmButton variant="outline" description="undo" action={() => props.moves.customUndo()}>
					Undo last action
				</ConfirmButton>
				: null}
			{props.playerData.data.admin && props.G.pausedAt !== undefined ?
				<Button variant="outline" onClick={() => moves.unpauseGame()}>Resume game</Button>
				: props.playerData.data.admin && !props.G.gameOver ?
				<Button variant="outline" onClick={() => moves.pauseGame()}>Pause game</Button>
				: null}
			{props.playerData.data.admin && !props.G.gameOver ? <ConfirmButton action={handleEndGame} description="end the game">End Game</ConfirmButton> : null}
			{process.env.BUG_REPORT ?
				<Anchor href={process.env.BUG_REPORT} target="_blank" rel="noopener noreferrer" size="sm" c="dimmed">
					Report a bug
				</Anchor>
				: null}
				</Stack>
			</CloseWithConfirm>
		</Modal>
	);
}

// Only on the /review screen: step through the match and pick whose view to show.
function ReviewSection() {
	const review = useContext(ReviewControlsContext);
	if (!review) return null;
	const { step, stepCount, stepLabel, goTo, players, playerID, setPlayerID, exit, mismatch } = review;
	const last = stepCount - 1;
	return (
		<Stack gap="xs" mb="md">
			<Group justify="center" gap="xs" wrap="nowrap">
				<ActionIcon variant="light" aria-label="First step" disabled={step === 0} onClick={() => goTo(0)}><FaFastBackward /></ActionIcon>
				<ActionIcon variant="light" aria-label="Previous step" disabled={step === 0} onClick={() => goTo(step - 1)}><FaStepBackward /></ActionIcon>
				<P mb="0" fw="bold">Step {step + 1} / {stepCount}</P>
				<ActionIcon variant="light" aria-label="Next step" disabled={step === last} onClick={() => goTo(step + 1)}><FaStepForward /></ActionIcon>
				<ActionIcon variant="light" aria-label="Last step" disabled={step === last} onClick={() => goTo(last)}><FaFastForward /></ActionIcon>
			</Group>
			<P mb="0" ta="center" fz="sm" c="dimmed">{stepLabel}</P>
			<Select
				label="Viewing as"
				data={players.map(player => ({ value: player.playerID, label: `${player.name} (${player.teamColor})` }))}
				value={playerID}
				onChange={value => value && setPlayerID(value)}
				allowDeselect={false}
				comboboxProps={{ zIndex: 1000 }}
			/>
			{mismatch ?
				<Alert color="yellow" p="xs">
					The replay doesn't match the saved final state. This match may have been played with older game rules.
				</Alert>
				: null}
			<Anchor component="button" fz="sm" onClick={exit}>Load another match</Anchor>
			<Divider />
		</Stack>
	);
}
