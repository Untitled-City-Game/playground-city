import { Challenge } from "@/scripts/games/challenge_deck/challenge_deck_types";
import { Color } from "@/scripts/types/types";
import { ChallengeCard } from "@/src/match/screens/match_tabs/challenges/UI/ChallengeCard";
import RuleBox from "@/src/match/screens/match_tabs/challenges/UI/RuleBox";
import Button from "@/src/userInterface/CustomButton";
import DashedCard from "@/src/userInterface/DashedCard";
import P from "@/src/userInterface/P";
import Span from "@/src/userInterface/Span";
import { Box,  Divider, Modal, Stack, useMantineTheme } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { FaExternalLinkSquareAlt, FaLock } from "react-icons/fa";

export default function ChallengePopup({
	opened,
	close,
	challengeInfo,
	team,
	completed,
	claimButton
}: {
	opened: boolean;
	close: () => void;
	challengeInfo: Challenge;
	team: Color;
	completed?: boolean;
	claimButton?: boolean;
}){
	return (
		<Modal.Root opened={opened}
		onClose={close}
		centered
		transitionProps={{transition: "scale"}}
		>
			<Modal.Overlay />
			        <Modal.Content
					bg="none"
					>
			<ChallengeCard teamColor={team} challenge={challengeInfo} completed={completed} claimButton={claimButton}/>
			</Modal.Content>
		</Modal.Root>
	)
}

export function ChallengeButton({
	challenge,
	team,
	completed,
	claimButton
} : {
	challenge: Challenge;
	team: Color;
	completed?: boolean;
	claimButton?: boolean;
}){
	const [opened, { open, close }] = useDisclosure(false);
	
	return(
	<><DashedCard color={team} w="100%" bd={challenge.hard ? `4px double ${team}` : `1.5px dashed ${team}`}
	onClick={open}
	>
			<P fw="bold">{challenge.emoji} {challenge.title}</P>
	</DashedCard>
	<ChallengePopup opened={opened} close={close} challengeInfo={challenge} team={team} completed={completed} claimButton={claimButton}/>
	</>
	
)
}

export function ChallengeBody({challenge, teamColor} : {challenge: Challenge, teamColor: string}) {
	const theme = useMantineTheme();
	return (<div>
		<Divider color={teamColor} />
		<div style={{ marginTop: "0.5rem" }}>
			{challenge.hard ? <>
				<FaLock color={theme.colors[teamColor]?.[8] ?? teamColor} />
				<Span fz="0.9rem"> This challenge can lock or steal a zone</Span></> : null}
		</div>
		<div>{challenge.description.split("\n").map((line, index) => <p key={index}>{line}</p>)}</div>
		<Stack>
			{challenge.rules.filter(rule => rule).map((rule, index) => {
				return <RuleBox key={index}>{rule}</RuleBox>;
			})}
		</Stack>
		{challenge.link.url ? 
		<Button w="100%" mt="0" variant="outline" component="a" target="_blank" href={challenge.link.url}>
			{challenge.link.name}<Box m="0" ml={3}><FaExternalLinkSquareAlt /></Box>
		</Button> : null}
		<Divider color={teamColor} mb="sm" mt="sm" />
	</div>);
}
