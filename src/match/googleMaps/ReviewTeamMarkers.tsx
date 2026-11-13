import { matchMapCenter } from "@/scripts/fetchMapData";
import { MatchTeamColor } from "@/scripts/types/types";
import { ConnectFourContext } from "@/src/match/Board";
import LocationMarker from "@/src/match/googleMaps/LocationMarker";
import { ReviewContext } from "@/src/review/ReviewContext";
import { useContext } from "react";

// Review mode only: a draggable pin per team, styled like live team pins, for
// placing teams by hand in clips (live locations were never recorded).
export default function ReviewTeamMarkers() {
	const review = useContext(ReviewContext);
	const G = useContext(ConnectFourContext);
	if (!review?.teamMarkers.enabled) return null;
	const { positions, move } = review.teamMarkers;
	const center = matchMapCenter(G.MatchMapData);
	const teams = [...new Set(Object.values(G.allPlayersData).map(player => player.teamColor))];
	return (
		<>
			{teams.map(team => (
				<LocationMarker
					key={team}
					position={positions[team] ?? center}
					color={team as MatchTeamColor}
					// Shown as a confident fix: no "location unknown" overlay
					accuracy={1}
					onDragEnd={position => move(team, position)}
				/>
			))}
		</>
	);
}
