import { PlayerData } from "@/scripts/types/types";
import Span from "@/src/userInterface/Span";


export function GamePaused({ senderData, paused }: { senderData: PlayerData; paused: boolean; }) {
	return (
		<>
			<Span fw="bold">{senderData.name}</Span> {paused ? "paused" : "resumed"} the game.
		</>
	);
}
