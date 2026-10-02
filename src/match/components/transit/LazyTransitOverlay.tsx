import { Bounds } from "@/scripts/types/transit";
import { lazy, Suspense } from "react";

// deck.gl is a large dependency only the in-game maps need, so it's split into
// its own chunk and loaded when a map first shows transit.
const TransitOverlay = lazy(() => import("@/src/match/components/transit/TransitOverlay"));

export default function LazyTransitOverlay({ bounds }: { bounds: Bounds | undefined }) {
	return (
		<Suspense fallback={null}>
			<TransitOverlay bounds={bounds} />
		</Suspense>
	);
}
