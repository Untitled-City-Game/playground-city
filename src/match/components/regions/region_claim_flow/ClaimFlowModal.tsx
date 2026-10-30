import { ConnectFourMoves } from "@/scripts/games/connect_four/connect_four";
import { ConnectFourGameState, ZoneData } from "@/scripts/games/connect_four/types";
import onlyUnique from "@/scripts/helpers/onlyUnique";
import { GameBoardContext } from "@/scripts/types/types";
import { ChallengeDeckContext, ConnectFourContext, GameContext, LocationContext } from "@/src/match/Board";
import claimZone from "@/src/match/components/regions/region_claim_flow/claimZone";
import { ModalHeader } from "@/src/match/components/regions/region_claim_flow/ui/ModalHeader";
import { useMyZoneRef } from "@/src/match/interfaces/useMyZone";
import { ReviewContext } from "@/src/review/ReviewContext";
import Button from "@/src/userInterface/CustomButton";
import {
	
	Container,
	FileInput,
	Modal,
	Select,
	Stack
} from "@mantine/core";
import { hasLength, useForm } from "@mantine/form";
import { useContext, useEffect } from "react";

const claimFormValues = {
	zone: "",
	challenge: "",
	evidence: [] as File[],
}
export type ClaimFormValues = typeof claimFormValues;

const DEBUG = false

export default function ClaimFlowModal({
	open,
	close,
	claimedZone,
	challengeTitle,
	inferZone
}: {
	open: boolean;
	close: () => void;
	claimedZone?: ZoneData;
	challengeTitle?: string;
	inferZone?: boolean;
}) {
	DEBUG && console.warn("rendering claim flow modal");
	const props: GameBoardContext = useContext(GameContext);
	const review = useContext(ReviewContext);
	
	const { allTeamsChallengeData } = useContext(ChallengeDeckContext);
	
	if (props.G.gameCode !== "connect_four") {
		throw new Error("no challenges, game code " + props.G.gameCode);
	}
	
	//const locationRef = useContext(LocationContext);
	const myZoneRef = useMyZoneRef()
	useEffect(() => {
		DEBUG && console.warn("running modal open effect");
		DEBUG && console.log("location: ", myZoneRef);

		if(inferZone){
			DEBUG && console.log("inferring zone")
			claimForm.setValues({ zone: String(myZoneRef.current?.id) }
		)}
	}, [open]);

	const claimForm = useForm({
		mode: "controlled",
		initialValues: {
			zone: claimedZone?.id ? String(claimedZone?.id) : claimFormValues.zone,
			challenge: challengeTitle || claimFormValues.challenge,
			evidence: claimFormValues.evidence,
		},
		validate: {
			zone: hasLength({ min: 1 }, 'Please select a zone'),
			challenge: hasLength({ min: 1 }, 'Please select a challenge'),
			// evidence: hasLength({ min: 1 }, 'Please include evidence!'),
		}
	});

	useEffect(() => {
		challengeTitle && claimForm.setValues({ challenge: challengeTitle });
	}, [challengeTitle]);

	useEffect(() => {
		claimedZone && claimForm.setValues({ zone: String(claimedZone.id) });
	}, [claimedZone]);

	function closeClaim() {
		claimForm.reset();
		close();
	}

	const { allPlayersData } = props.G;
	const playerData = allPlayersData[props.playerData.data.playerID];
	const myTeam = playerData.teamColor;
	const challengeHand = allTeamsChallengeData[myTeam]?.challengeHand.map(challenge => challenge.title);
	const allZones = props.G.zoneData.map(zone => { return { value: `${zone.id}`, label: zone.name } });
	const zoneSelectOptions = validZones(allZones, props.G)

	function handleSubmit(values: ClaimFormValues) {
		// Reviewing: nothing to claim, and evidence mustn't be uploaded
		if (review) return closeClaim();
		const moves = props.moves as ConnectFourMoves
		// Evidence uploads in the background, so there's nothing to wait for.
		claimZone(props.playerData.data.playerID, moves, Number(values.zone), values.challenge, values.evidence);
		closeClaim();
	}

	return (
		<Modal.Root
			opened={open}
			onClose={closeClaim}
			padding={0}
			radius={0}
			centered>
			<Modal.Overlay />
			<Modal.Content>
				{ModalHeader()}
				<Modal.Body>
					<Container pb="md">
						<form onSubmit={claimForm.onSubmit(handleSubmit)}>
							<Stack ta="left">
								<Select 
									label="Claiming neighbourhood" 
									data={zoneSelectOptions} {...claimForm.getInputProps("zone")} 
									defaultValue={String(claimedZone?.id || "")} 
								/>
								<Select label="With challenge" data={onlyUnique(challengeHand)} {...claimForm.getInputProps("challenge")} defaultValue={challengeTitle} />
								<FileInput
									label="Evidence"
									multiple
									{...claimForm.getInputProps("evidence")}
								/>
								<Button type="submit">Submit</Button>
							</Stack>
						</form>
					</Container>
				</Modal.Body>
			</Modal.Content>
		</Modal.Root>
	);
}


// <Stepper
// 							active={step}
// 							styles={{
// 								steps: { display: "none" },
// 							}}>
// 							{!challengeTitle ? <Stepper.Step>
// 								<ChooseChallenge
// 									props={props}
// 									radioGroupProps={{...claimForm.getInputProps('challenge')}}
// 								/>
// 							</Stepper.Step> : null}
// 							{!claimedZone ? <Stepper.Step>
// 								<ChooseZone
// 									props={props}
// 									radioGroupProps={{...claimForm.getInputProps('zone')}}
// 								/>
// 							</Stepper.Step> : null}
// 							<Stepper.Step>
// 								<Evidence props={props} radioGroupProps={{...claimForm.getInputProps('zone')}} />
// 							</Stepper.Step>
// 							<Stepper.Completed>
// 								<ConfirmClaim
// 									currentFormValues={claimForm.values}
// 									zoneName={claimForm.values.zone ? props.G.zoneData[Number(claimForm.values.zone)]?.name : ""}
// 								/>
// 							</Stepper.Completed>
// 						</Stepper>


export function validZones(zones :  {
    value: string;
    label: string;
}[], gameState: ConnectFourGameState){
		let validZones : {value: string, label: string}[] = [...zones]
	
	//remove starting zone if no zones are claimed
	if(!isStartZoneClaimable(gameState.zoneData)){
		console.log("nothing is claimed")
		validZones = validZones.filter(zone => zone.label !== gameState.startingZone)
	}
	return validZones;
}

export function isStartZoneClaimable(zoneData: ZoneData[]){
	return zoneData.some(zone => zone.controlTeam)
}

export function isZoneDisabled(zoneName: string, gameState: ConnectFourGameState){
	return !isStartZoneClaimable(gameState.zoneData) && (zoneName === gameState.startingZone)
}