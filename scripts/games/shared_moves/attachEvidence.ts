import { GameStateUniversal, MoveContext } from "@/scripts/types/types";

// Called by the claiming client once its background evidence upload finishes.
// Deliberately creates no undo point: evidence is kept outside undo snapshots.
export function attachEvidence(
	{ G, playerID }: MoveContext<GameStateUniversal>,
	evidenceId: string,
	urls: string[]
) {
	const upload = G.evidenceUploads?.[evidenceId];
	if (!upload || upload.status !== "uploading" || upload.playerID !== playerID) {
		return "INVALID_MOVE";
	}
	// uploadImage returns "" for files that failed.
	upload.urls = urls.filter(url => url);
	upload.status = upload.urls.length === upload.fileTypes.length ? "done" : "failed";
}
