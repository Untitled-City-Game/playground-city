import { MatchTeamColor } from "@/scripts/types/types";
import { GameContext } from "@/src/match/Board";
import TeamColorModal from "@/src/match/screens/game_status/TeamColorModal";
import Span from "@/src/userInterface/Span";
import TeamAvatar from "@/src/userInterface/TeamAvatar";
import { useDisclosure } from "@mantine/hooks";
import { useContext, useEffect } from "react";

export default function VictoryModal(){
	const GameState = useContext(GameContext);
	const myTeam = GameState.playerData.data.teamColor;
	const [opened, { open, close }] = useDisclosure(GameState.G.victory !== undefined);
	useEffect(()=> {
		// A win by another team is shown as part of OtherTeamClaimModal instead.
		if(GameState.G.victory !== undefined && GameState.G.victory === myTeam){
			open()
		}
	}, [GameState.G.victory])
	if (!GameState.G.victory) return null;
	return (
		<TeamColorModal opened={opened} onClose={close} team={GameState.G.victory} title="Winner!">
			<VictoryMessage team={GameState.G.victory} />
		</TeamColorModal>
	)
}

export function VictoryMessage({ team }: { team: MatchTeamColor }) {
	const GameState = useContext(GameContext);
	return (
		<>
			<TeamAvatar color={team} photoURL={GameState.G.teamPhotoURLs[team]} style={teamImgStyle} />
			🎆 <Span tt="capitalize">{team}</Span> team completed a line of 4 to win the game! 🎆
		</>
	)
}

const teamImgStyle : React.CSSProperties = {
		display: 'block',
		margin: 'auto',
		width: `60%`,
		objectFit: "cover",
		borderRadius: "8px",
		}
