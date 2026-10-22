import { Bounds, boundsToQuery, TransitFeatureCollection } from "@/scripts/types/transit";
import { useEffect, useState } from "react";

export function transitUrl(bounds: Bounds): string {
	return `${process.env.GAME_SERVER}/transit?bbox=${boundsToQuery(bounds)}`;
}

/**
 * Transit lines and stations for the play area. Undefined while loading, or if
 * it couldn't be fetched — the overlay is a nice-to-have, so failures are only
 * logged.
 */
export default function useTransitData(bounds: Bounds | undefined): TransitFeatureCollection | undefined {
	const [data, setData] = useState<TransitFeatureCollection>();
	const query = bounds && boundsToQuery(bounds);

	useEffect(() => {
		if (!bounds) return;
		let cancelled = false;
		fetch(transitUrl(bounds))
			.then(res => {
				if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
				return res.json() as Promise<TransitFeatureCollection>;
			})
			.then(json => { if (!cancelled) setData(json); })
			.catch(error => console.warn("Could not load transit data", error));
		return () => { cancelled = true; };
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [query]);

	return data;
}
