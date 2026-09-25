import { cities, CUSTOM_CITY, gameLocationCenters, maps } from "@/scripts/consts";
import { CUSTOM_MAP_HELP, parseCustomMapId } from "@/scripts/customMap";
import { fetchChallenges } from "@/scripts/games/challenge_deck/fetchChallenges";
import { fetchMapData } from "@/scripts/fetchMapData";
import { City, CityOrCustom, MatchMapData } from "@/scripts/types/types";
import CreateMatchTemplate, { createGameFormConstructor, FormValues } from "@/src/lobby/CreateMatch/CreateMatchTemplate";
import StartingZonePicker from "@/src/lobby/CreateMatch/StartingZonePicker";
import { ThemeColor } from "@/src/styles/theme";
import Button from "@/src/userInterface/CustomButton";
import P from "@/src/userInterface/P";
import Segment from "@/src/userInterface/Segment";
import { Select, Stack, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";
import { useGeolocated } from "react-geolocated";

// Great-circle distance in km. Picking the closest city only needs relative
// ordering, so any monotonic distance function would do; haversine is cheap.
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
	const R = 6371;
	const toRad = (deg: number) => (deg * Math.PI) / 180;
	const dLat = toRad(b.lat - a.lat);
	const dLng = toRad(b.lng - a.lng);
	const lat1 = toRad(a.lat);
	const lat2 = toRad(b.lat);
	const s = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
	return 2 * R * Math.asin(Math.sqrt(s));
}

function closestCity(userLoc: { lat: number; lng: number }): City {
	let best: City = "london";
	let bestDist = Infinity;
	for (const [code, center] of Object.entries(gameLocationCenters)) {
		const d = haversineKm(userLoc, center);
		if (d < bestDist) {
			bestDist = d;
			best = code as City;
		}
	}
	return best;
}

export default function CreateMatchConnectFour() {
	const teamOptions = ["red", "blue"];

	const [city, setCity] = useState<CityOrCustom>("london");
	const [customMapLink, setCustomMapLink] = useState("");
	// The id we've actually been asked to load. Set only by the Import button, so
	// half-typed links never kick off a fetch.
	const [importedMapId, setImportedMapId] = useState<string | undefined>();
	// Bumped on every import press so retrying a map that failed re-runs the fetch
	// even though the id hasn't changed.
	const [importAttempt, setImportAttempt] = useState(0);
	const [linkError, setLinkError] = useState<string | undefined>();
	const [mapData, setMapData] = useState<MatchMapData | undefined>();
	const [mapError, setMapError] = useState<string | undefined>();
	const [startingZone, setStartingZone] = useState<string>("");
	const [cityManuallyPicked, setCityManuallyPicked] = useState(false);

	const customMapId = city === CUSTOM_CITY ? importedMapId : undefined;
	const canImport = city === CUSTOM_CITY && !!parseCustomMapId(customMapLink);

	const { coords } = useGeolocated({
		positionOptions: { enableHighAccuracy: false },
		userDecisionTimeout: 5000,
	});

	// Auto-select the nearest city when geolocation resolves, unless the player
	// has already picked one manually.
	useEffect(() => {
		if (!coords || cityManuallyPicked) return;
		const nearest = closestCity({ lat: coords.latitude, lng: coords.longitude });
		if (nearest === city) return;
		setCity(nearest);
		createGameForm.setFieldValue("city", nearest);
	}, [coords, cityManuallyPicked]);

	// Built-in cities preload as soon as the city is known, so the starting-zone
	// step doesn't have to wait. A custom map loads when the player imports it —
	// which doubles as validation, since whatever loads here is what the match gets.
	useEffect(() => {
		let cancelled = false;
		setMapData(undefined);
		setMapError(undefined);
		if (city === CUSTOM_CITY && !customMapId) return;
		fetchMapData(city, customMapId).then((data) => {
			if (!cancelled) setMapData(data);
		}).catch((e) => {
			if (!cancelled) setMapError(e instanceof Error ? e.message : "Could not load that map.");
		});
		return () => { cancelled = true; };
	}, [city, customMapId, importAttempt]);

	//Setup mantine form
	const createGameForm = createGameFormConstructor(
		{
			city: "london" as CityOrCustom,
			customMapLink: "",
			startingZone: "",
		},
		{
			city: (value: string) =>
				value === CUSTOM_CITY || cities.includes(value as City) ? null : "Invalid city",
			// Format check only. Whether the map actually loads is settled by the
			// Import button, which also gates the step via firstStepBlocked.
			customMapLink: (value: string, values: FormValues) =>
				values.city !== CUSTOM_CITY || parseCustomMapId(value ?? "")
					? null
					: "Paste a Google My Maps link (it should contain \"mid=\")",
			startingZone: (value: string) => value ? null : "Pick a starting neighbourhood",
		},
		teamOptions
	)

	function handleCityChange(value: string | null) {
		createGameForm.setFieldValue("city", value);
		if (value) setCity(value as CityOrCustom);
		setCityManuallyPicked(true);
		clearStartingZone();
	}

	function handleCustomLinkChange(value: string) {
		setCustomMapLink(value);
		createGameForm.setFieldValue("customMapLink", value);
		setLinkError(undefined);
		// Editing the link drops the imported map: what's on screen should always
		// be what the link in the box points at.
		setImportedMapId(undefined);
		clearStartingZone();
	}

	function handleImport() {
		const mapId = parseCustomMapId(customMapLink);
		if (!mapId) {
			setLinkError(customMapLink.trim()
				? "That link has no map id in it (look for \"mid=\")"
				: "Paste your Google My Maps link first");
			return;
		}
		setLinkError(undefined);
		setImportedMapId(mapId);
		setImportAttempt((n) => n + 1);
		clearStartingZone();
	}

	function clearStartingZone() {
		setStartingZone("");
		createGameForm.setFieldValue("startingZone", "");
	}

	const ConnectFourSetupData = async (values: FormValues) => {
		const [mapSetupData, challengeData] = await Promise.all([
			mapData ? Promise.resolve(mapData) : fetchMapData(values.city as CityOrCustom, customMapId),
			fetchChallenges(values.city as CityOrCustom),
		]);
		return {
			mapSetupData,
			gameName: values.gameName,
			startingZone: values.startingZone as string,
			challengeData,
		};
	};

	return (
		<CreateMatchTemplate
			teamOptions={teamOptions}
			gameCode={"connect_four"}
			getSetupData={ConnectFourSetupData}
			createGameForm={createGameForm}
			firstStepFields={["city", "customMapLink"]}
			firstStepBlocked={city === CUSTOM_CITY && !mapData}
			extraSteps={[{
				label: "Start",
				fields: ["startingZone"],
				content: (
					<StartingZonePicker
						city={city}
						customMapId={customMapId}
						mapData={mapData}
						value={startingZone}
						onChange={(zone) => {
							setStartingZone(zone);
							createGameForm.setFieldValue("startingZone", zone);
						}}
						onMapDataLoaded={setMapData}
					/>
				),
			}]}
		>
			<Select
				label="Choose a city"
				placeholder="Melbourne"
				data={[
					{
						group: "Cities",
						items: Object.values(maps).map(map => ({
							label: map.name,
							value: map.code
						})),
					},
					{
						group: "Your own map",
						items: [{ label: "Custom city map", value: CUSTOM_CITY }],
					},
				]}
				key={createGameForm.key("city")}
				{...createGameForm.getInputProps("city")}
				onChange={handleCityChange}
			/>
			{city === CUSTOM_CITY && (
				<>
					<TextInput
						label="Google My Maps link"
						placeholder="https://www.google.com/maps/d/edit?mid=..."
						description={CUSTOM_MAP_HELP}
						value={customMapLink}
						error={linkError}
						onChange={(event) => handleCustomLinkChange(event.currentTarget.value)}
						onKeyDown={(event) => {
							// Enter in this box means "import", not "next step".
							if (event.key !== "Enter") return;
							event.preventDefault();
							handleImport();
						}}
					/>
					<Button
						type="button"
						onClick={handleImport}
						disabled={!canImport || (!!customMapId && !mapError)}
						loading={!!customMapId && !mapData && !mapError}
					>
						{mapError ? "Try again" : customMapId && mapData ? "Imported" : "Import map"}
					</Button>
					<CustomMapStatus
						mapId={customMapId}
						mapData={mapData}
						error={mapError}
						readyToImport={canImport && !customMapId}
					/>
				</>
			)}
		</CreateMatchTemplate>
	);
}

// Tells the player whether their map is usable before they commit to it: a map
// with no winning lines drawn on it can be claimed but never won. Styled as a
// Segment so it reads as the same kind of region as the lobby's own sections.
function CustomMapStatus({ mapId, mapData, error, readyToImport }: {
	mapId?: string;
	mapData?: MatchMapData;
	error?: string;
	readyToImport?: boolean;
}) {
	if (error) {
		return (
			<StatusSegment color="red" title="Couldn't load that map">
				<P mb={0}>{error}</P>
			</StatusSegment>
		);
	}
	if (!mapId) {
		return (
			<StatusSegment color="grey" title="Before you import">
				<P mb={0}>
					Your map needs a shape for each neighbourhood, and a line through every
					run of four that should count as a win.
				</P>
				{/* Without this the Next button just quietly refuses once a link is typed. */}
				{readyToImport && <P mb={0} mt="xs">Import the map to check it over before you start.</P>}
			</StatusSegment>
		);
	}
	// Loading is shown on the Import button itself.
	if (!mapData) return null;
	const zoneCount = mapData.zonePolygons.length;
	const lineCount = mapData.winningLines.length;
	return (
		<StatusSegment
			color={lineCount === 0 ? "yellow" : "green"}
			title={mapData.mapName || "Custom map"}
		>
			<P mb={0}>
				{zoneCount} neighbourhood{zoneCount === 1 ? "" : "s"}, {lineCount} winning line{lineCount === 1 ? "" : "s"}.
			</P>
			{lineCount === 0 && (
				<P mb={0} mt="xs">
					Without winning lines no team can win — draw a line through each run of
					four neighbourhoods in My Maps, then import again.
				</P>
			)}
		</StatusSegment>
	);
}

// Same dashed region + heading pairing the lobby uses for "Create a match" etc.
function StatusSegment({ color, title, children }: {
	color: ThemeColor;
	title: string;
	children: React.ReactNode;
}) {
	return (
		<Segment color={color}>
			<Stack gap="0">
				<h2 style={{ margin: "0 0 0.5rem 0" }}>{title}</h2>
				{children}
			</Stack>
		</Segment>
	);
}
