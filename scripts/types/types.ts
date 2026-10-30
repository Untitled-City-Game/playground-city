import { UseFormReturnType } from '@mantine/form';
import { Ctx, DefaultPluginAPIs, LobbyAPI } from 'boardgame.io';
import { BoardProps } from 'boardgame.io/react';
import { LineString } from 'geojson';
import { Dispatch, JSX, ReactElement, SetStateAction } from 'react';
import { AppEnv, cities, CUSTOM_CITY } from '../consts';
import { SnakeGameState } from '@/scripts/games/snake/types';
import { PolyData, LineData } from '@/scripts/types/googleMaps';
import { ConnectFourGameState } from '@/scripts/games/connect_four/types';
import { IconType } from 'react-icons/lib';
import { Challenge } from '@/scripts/games/challenge_deck/challenge_deck_types';


export type GameStateUniversal = {
	gameName: string;
	gameCode: string;
	allPlayersData: AllPlayersData;
	allTeamsData : {[key in MatchTeamString] : string[]}
	gameOver: boolean;
	startTime?: number;
	endTime?: number;
	// Chosen at match creation. Missing for matches created before it existed.
	gameTimeMinutes?: number;
	// Set while an admin has paused the game; the timer is frozen at this moment.
	pausedAt?: number;
	gameStateLogs: GameStateLog<GameStateUniversal>[]
	active: boolean;
	teamPhotoURLs: {[key in MatchTeamString] : string}
	victory?: MatchTeamColor
	// Challenge evidence uploaded in the background after a claim, keyed by the
	// evidenceId stored in that claim's log metadata.
	evidenceUploads?: Record<string, EvidenceUpload>
}

export type EvidenceUpload = {
	status: "uploading" | "done" | "failed";
	playerID: string;
	fileTypes: string[];
	urls: string[];
}

export type GameStateGeneric = ConnectFourGameState | SnakeGameState
interface GameStateEverything extends Omit<ConnectFourGameState, 'gameCode' | 'gameStateLogs'>, Omit<SnakeGameState, 'gameCode' | 'gameStateLogs'> {}

export interface GameStateAnything extends GameStateUniversal, Partial<Omit<GameStateEverything, keyof GameStateUniversal>>{}

export type MoveContext<SomeGameState extends GameStateUniversal> = DefaultPluginAPIs & { G: SomeGameState; ctx: Ctx; playerID: string };


// Undo snapshots stored in gameStateLogs. We omit gameStateLogs itself (no
// nesting) plus fields that are fixed at setup() and never change during play
// (MatchMapData, challengeDeck) — those are restored from the live state on
// undo instead of being copied into every snapshot. evidenceUploads is also
// kept live so undo never discards media that finished uploading later. Omit
// ignores keys that a given game state doesn't have (e.g. Snake has no
// MatchMapData).
export type GameStateLog<GameState extends GameStateUniversal> = Omit<GameState, "gameStateLogs" | "MatchMapData" | "challengeDeck" | "evidenceUploads">

export type AllPlayersData = {
	[key:string] : PlayerData
}

export type PlayerData = {
	playerID: `${number}`;
	name: string;
	teamColor: MatchTeamColor;
	playerCredentials?: string;
	matchID?: string;
	gameCode?: string;
	admin?: boolean;
}

// export type AllTeamsData = {
// 	[key in MatchTeamString] : TeamData
// }

// export type TeamData = {
// 	challengeDeck : Challenge[];
// 	challengeHand : Challenge[];
// 	challengeDiscard : Challenge[];
// }

export type zoneStatus = Color | "empty";

export interface MapData {
	zonePolygons: PolyData[];
	winningLines: LineData[];
}

export type City = typeof cities[number];

export type CustomCity = typeof CUSTOM_CITY;

// Anywhere a match can be played: one of the built-in cities, or a player-supplied
// Google My Maps map. Keyed lookups into `maps`/`gameLocationCenters` only accept
// `City`, so narrow before indexing them.
export type CityOrCustom = City | CustomCity;

export type GameSetupDataGeneric = {
	gameName: string,
	winter: boolean,
	money: boolean,
	gameTimeMinutes?: number
}

export interface MatchMapData extends MapData {
	city : CityOrCustom;
	// Name to show players. Built-in cities use their entry in `maps`; custom maps
	// use the title from the KML document.
	mapName?: string;
	// Google My Maps id the KML came from. Only set for custom maps.
	customMapId?: string;
	// Where to point the camera. Optional because matches created before custom
	// maps existed have no centre stored — use `matchMapCenter()` to read it.
	center?: google.maps.LatLngLiteral;
}

export type ClientSetupData = {
	playerData: {
		data: PlayerData;
		setter?: Dispatch<SetStateAction<PlayerData | undefined>>
	};
	matchID?: string;
	gameCode: string;
	credentials?: string;
	playerID: string;
}

export type StrictMatch = Omit<LobbyAPI.Match, 'gameover' | 'setupData'> & { gameover: boolean, setupData: GameSetupDataGeneric };

export type GameBoardContextSpecific<GameState> = BoardProps<GameState> & ClientSetupData

export type GameBoardContext = BoardProps<GameStateGeneric> & ClientSetupData

export type LogMetadata = {
	date?: string;
	evidence?: string[];
	evidenceId?: string;
	challenge?: string;
	zone?: number;
	zoneName?: string;
	team: Color;
	claimType?: "lock" | "claim" | "steal";
	stealFrom?: Color;
	// Set on the claim that completed the winning line.
	victory?: MatchTeamColor;
	growth?: number
	chatText?: string;
}

export type GameMeta = {
    name: string;
    code: string;
    // Whether the game can be picked in each environment; see isGameEnabled
    enabled: Record<AppEnv, boolean>;
    description: string;
    color: string;
    icon: IconType;
	playerMin: number;
	playerMax: number;
	minTimeMinutes: number;
	maxTimeMinutes: number;
}

export type LocationResult = {
	position: google.maps.LatLngLiteral,
	accuracy?: number,
	time?: number,
	invalid: boolean
}

export type LocationData = {
	matchID: string,
	teamName: MatchTeamColor,
	playerID: string,
	timestamp: number,
	location: google.maps.LatLngLiteral,
	accuracy: number,
	invalid?: boolean
}

type RGB = `rgb(${number}, ${number}, ${number})`;
type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`;
type HEX = `#${string}`;
export type NamedColor = "red" | "blue" | "green" | "yellow" | "purple" | "orange" | "black" | "white"| "grey";

export type Color = RGB | RGBA | HEX | NamedColor;

export type CoordSet = {lat: number, long: number}

export type MatchTeamString = string & {__isMatchTeam: true};
export type MatchTeamColor = NamedColor & {__isMatchTeam: true};
export type ClaimZoneFormValues = UseFormReturnType<
	{
		zone: number;
		challenge: string;
		evidence: string;
	}, (values: { challenge: string; evidence: string; }) => {
		zone: number;
		challenge: string;
		evidence: string;
	}
>;

export type TabData = {
	 name: string;
    component: ({ active }: {
        active: string | null;
    }) => JSX.Element;
    icon: IconType;
}


export type StripContext<T> = {
	[K in keyof T]: T[K] extends (context: infer C, ...args: infer A) => infer R
		? (...args: A) => R
		: never;
};