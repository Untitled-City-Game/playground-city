import { UseFormReturnType } from '@mantine/form';
import { Ctx, DefaultPluginAPIs, LobbyAPI } from 'boardgame.io';
import { BoardProps } from 'boardgame.io/react';
import { LineString } from 'geojson';
import { Dispatch, JSX, ReactElement, SetStateAction } from 'react';
import { cities } from '../consts';
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
	gameStateLogs: GameStateLog<GameStateUniversal>[]
	active: boolean;
	teamPhotoURLs: {[key in MatchTeamString] : string}
	victory?: MatchTeamColor
}

export type GameStateGeneric = ConnectFourGameState | SnakeGameState
interface GameStateEverything extends Omit<ConnectFourGameState, 'gameCode' | 'gameStateLogs'>, Omit<SnakeGameState, 'gameCode' | 'gameStateLogs'> {}

export interface GameStateAnything extends GameStateUniversal, Partial<Omit<GameStateEverything, keyof GameStateUniversal>>{}

export type MoveContext<SomeGameState extends GameStateUniversal> = DefaultPluginAPIs & { G: SomeGameState; ctx: Ctx; playerID: string };


// Undo snapshots stored in gameStateLogs. We omit gameStateLogs itself (no
// nesting) plus fields that are fixed at setup() and never change during play
// (MatchMapData, challengeDeck) — those are restored from the live state on
// undo instead of being copied into every snapshot. Omit ignores keys that a
// given game state doesn't have (e.g. Snake has no MatchMapData).
export type GameStateLog<GameState extends GameStateUniversal> = Omit<GameState, "gameStateLogs" | "MatchMapData" | "challengeDeck">

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

export type GameSetupDataGeneric = {
	gameName: string,
	winter: boolean,
	money: boolean
}

export interface MatchMapData extends MapData {
	city : City;
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
	challenge?: string;
	zone?: number;
	zoneName?: string;
	team: Color;
	claimType?: "lock" | "claim" | "steal";
	stealFrom?: Color;
	growth?: number
	chatText?: string;
}

export type GameMeta = {
    name: string;
    code: string;
    active: boolean;
    description: string;
    color: string;
    icon: IconType;
	playerMin: number;
	playerMax: number;
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