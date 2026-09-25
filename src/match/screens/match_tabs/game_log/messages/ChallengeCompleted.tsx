import { LogMetadata } from "@/scripts/types/types";
import ImageMantine from "@/src/userInterface/ImageMantine";
import { Box, Loader, Stack } from "@mantine/core";
import ReactPlayer from "react-player";
import P from "@/src/userInterface/P";
import { useContext, useEffect, useState } from "react";
import getMime from "@/scripts/helpers/mime";
import { GameContext } from "@/src/match/Board";
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
		
		if (fileCategory === "image") {
			return (
				<ImageMantine
					style={{
						borderRadius: "10px",
					}}
					key={link}
					src={link}
					alt={`${metadata.team} team completed challenge ${metadata.challenge} to claim zone ${metadata.zone}`}
					w="min(80%, 300px)"
					mb="4px"
				/>
			);
		}
		if(fileCategory === "video"){
			return (
				<>
					{/* <video style={{maxWidth: "min(80%, 300px)", marginBottom: "4px"}} controls>
						<source src={imageLink} type={fileMime as string} />
					</video> */}
					<Box>
					<ReactPlayer width={"300px"} url={link} controls />
					</Box>
					</>
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
