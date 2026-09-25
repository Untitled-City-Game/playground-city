import { addTeamPhoto } from "@/scripts/games/shared_moves/addTeamPhoto";
import { attachEvidence } from "@/scripts/games/shared_moves/attachEvidence";
import { endGame } from "@/scripts/games/shared_moves/manageGame";
import { sendChatMessage } from "@/scripts/games/shared_moves/sendChatMessage";
import { StripContext } from "@/scripts/types/types";

export const sharedMoves = {
	addTeamPhoto,
	attachEvidence,
	endGame,
	sendChatMessage,
}

export type SharedMoves = StripContext<typeof sharedMoves>;
