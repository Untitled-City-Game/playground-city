import { LogMetadata } from "@/scripts/types/types";
import ImageMantine from "@/src/userInterface/ImageMantine";
import { Box, Group, Loader, Stack } from "@mantine/core";
import P from "@/src/userInterface/P";
import { useContext, useEffect, useState } from "react";
import getMime from "@/scripts/helpers/mime";
import { GameContext } from "@/src/match/Board";
import { ShareEvidenceButton } from "@/src/match/screens/match_tabs/game_log/messages/ShareEvidenceButton";
const DEBUG = true;

export function ClaimChallengeCompleted({ metadata }: { metadata: LogMetadata; }) {
	return (
		<>
			<span className="capitalize">{metadata.team} team</span> completed challenge <strong>{metadata.challenge}</strong> to {metadata.claimType || "claim"} <strong>{metadata.zoneName || metadata.zone}</strong> {metadata.stealFrom ? `from ${metadata.stealFrom}` : null}
		</>
	);
}


export function FruitEaten({ metadata }: { metadata: LogMetadata; }) {
	return (
		<>
			<span className="capitalize">{metadata.team} team</span> completed challenge <strong>{metadata.challenge}</strong> and grew {metadata.growth}m
		</>
	);
}

type EvidenceMime = {
	link: string,
	fileType: string,
	fileCategory: string,
} | undefined

export function ChallengeEvidence({ metadata, myMessage }: { metadata: LogMetadata; myMessage?: boolean }) {
	const { G } = useContext(GameContext);
	// Newer claims reference a background upload in G; older entries (and
	// Snake) carry the URLs directly in the log metadata.
	const upload = metadata.evidenceId ? G.evidenceUploads?.[metadata.evidenceId] : undefined;
	const evidenceUrls = upload ? upload.urls : metadata.evidence ?? [];
	const [evidenceMime, setEvidenceMime] = useState<EvidenceMime[]>([])
		useEffect(() => {
			findEvidenceType(evidenceUrls)
		}, [evidenceUrls.join()])

	async function findEvidenceType(evidence : string[]){
		const mimedEvidence : Array<EvidenceMime>= await Promise.all(evidence.map(async imageLink => {
			const fileName = imageLink.split('?')[0]
			const fileMime = getMime(fileName)
			if(fileMime){
				const [fileCategory, fileType] = fileMime.split('/')
				return {
					link: imageLink,
					fileType,
					fileCategory
				}
			}
		}))
		setEvidenceMime(mimedEvidence)
	}
	const evidenceImages = evidenceMime?.map(imageData => {
		if(!imageData) return null
		const {link, fileType, fileCategory} = imageData;
		
		DEBUG && console.warn("my message?", myMessage)
		
		const mime = `${fileCategory}/${fileType}`;
		const shareTitle = `${metadata.team} team: ${metadata.challenge}`;
		const shareButton = <ShareEvidenceButton link={link} mime={mime} title={shareTitle} />;
		if (fileCategory === "image") {
			return (
				<EvidenceRow key={link} myMessage={myMessage} shareButton={shareButton}>
					<ImageMantine
						style={{
							borderRadius: "10px",
						}}
						src={link}
						alt={`${metadata.team} team completed challenge ${metadata.challenge} to claim zone ${metadata.zone}`}
						w="min(80%, 300px)"
					/>
				</EvidenceRow>
			);
		}
		if(fileCategory === "video"){
			// Fixed width like a message bubble; height: auto keeps the video's own
			// aspect ratio, so there's no letterboxing.
			return (
				<EvidenceRow key={link} myMessage={myMessage} shareButton={shareButton}>
					<video
						src={link}
						controls
						preload="metadata"
						style={{
							display: "block",
							width: "80%",
							height: "auto",
							borderRadius: "10px",
						}}
					/>
				</EvidenceRow>
			);
		}
		return (
		<Box key={link}>
			<P>I don't know how to display this data!</P>
		</Box>)
	});

	const failedCount = upload?.status === "failed" ? upload.fileTypes.length - upload.urls.length : 0;

	return (
		<Stack align={myMessage ? "flex-end" : "flex-start"} justify={myMessage ? "flex-end" : "flex-start"}>
			{upload?.status === "uploading"
				? upload.fileTypes.map((fileType, index) => <EvidencePlaceholder key={index} fileType={fileType} />)
				: evidenceImages}
			{failedCount > 0 ? <P c="dimmed" fz="sm">{failedCount} file{failedCount === 1 ? "" : "s"} failed to upload</P> : null}
		</Stack>
	)

}


// Media with its share button beside it, vertically centred, on the side away
// from the edge the message is aligned to (like WhatsApp's forward button).
function EvidenceRow({ myMessage, shareButton, children }: { myMessage?: boolean; shareButton: React.ReactNode; children: React.ReactNode }) {
	return (
		<Group w="100%" gap="xs" mb="4px" wrap="nowrap" align="center" justify={myMessage ? "flex-end" : "flex-start"}>
			{myMessage ? shareButton : null}
			{children}
			{myMessage ? null : shareButton}
		</Group>
	);
}

function EvidencePlaceholder({ fileType }: { fileType: string }) {
	const kind = fileType.startsWith("video") ? "video" : "photo";
	return (
		<Stack
			w="min(80%, 300px)"
			h="170px"
			mb="4px"
			bg="gray.1"
			align="center"
			justify="center"
			gap="xs"
			style={{ borderRadius: "10px" }}
		>
			<Loader size="sm" color="gray" />
			<P c="dimmed" fz="sm" pb={0}>Uploading {kind}…</P>
		</Stack>
	);
}
