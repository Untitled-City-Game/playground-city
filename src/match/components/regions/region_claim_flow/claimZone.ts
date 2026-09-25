import { storage } from "@/scripts/firebase";
import { ConnectFourMoves } from "@/scripts/games/connect_four/connect_four";
import resizeImage from "@/src/match/components/regions/region_claim_flow/resizeImage";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

const DEBUG = true

// Applies the claim immediately, then uploads the evidence in the background.
// The log shows a placeholder until attachEvidence delivers the URLs.
export default function claimZone(playerId : string, moves : Pick<ConnectFourMoves, "completeChallengeAndClaim" | "attachEvidence">, zoneId: number, challenge : string, evidence : File[] ) {
	DEBUG && console.log("claiming zone on client", zoneId, challenge, evidence);
	const files = evidence ?? [];
	// Not crypto.randomUUID: it's unavailable over plain http (LAN phone testing).
	const evidenceId = `${playerId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
	moves.completeChallengeAndClaim(zoneId, challenge, evidenceId, files.map(file => file.type));
	if (files.length === 0) return;

	trackPendingUpload(1);
	uploadEvidence(files, playerId)
		.then(evidenceUrls => {
			DEBUG && console.log("got urls", evidenceUrls)
			moves.attachEvidence(evidenceId, evidenceUrls);
		})
		.catch(e => {
			console.error("evidence upload failed", e);
			moves.attachEvidence(evidenceId, []);
		})
		.finally(() => trackPendingUpload(-1));
}

// Warn before leaving while uploads are in flight, since a closed tab would
// leave the placeholder stuck on "uploading" for everyone.
let pendingUploads = 0;
function warnBeforeUnload(event: BeforeUnloadEvent) {
	event.preventDefault();
}
function trackPendingUpload(change: number) {
	pendingUploads += change;
	if (pendingUploads > 0) {
		window.addEventListener("beforeunload", warnBeforeUnload);
	} else {
		window.removeEventListener("beforeunload", warnBeforeUnload);
	}
}

export async function uploadEvidence(evidence: File[], playerId: string) {
	if(!evidence) return [];
	const evidenceUrls = await Promise.all(evidence.map((file, index) => uploadImage(file, playerId, index)));
	return evidenceUrls;
}

async function uploadImage(original: File, playerId: string, index:number) {
	const image = await resizeImage(original);
	DEBUG && console.log("image name", image.name, "size", original.size, "->", image.size, "playerid", playerId, "time", Date.now(), "index", index)
	const imageRef = ref(
		storage,
		`images/player${playerId}${Date.now()}${index}.${image.name.split('.').pop()}`
	);
	try {
		const uploadTask = await uploadBytes(imageRef, image);
		console.log("Uploaded bytes to: ", uploadTask.metadata.fullPath);
	} catch (e) {
		console.error("Error adding document: ", e);
	}
	
	let evidenceURL = "";

	try{
		 evidenceURL = await getDownloadURL(imageRef);
	} catch{
		console.error("couldn't get download url");
	}
	return evidenceURL;
}