import { City, CoordSet, GameStateLog, GameStateUniversal, PlayerData } from "@/scripts/types/types";
import { MapAreaSelectorValue } from "@/src/lobby/CreateMatch/MapAreaSelector";

export interface SnakeGameState extends GameStateUniversal {
	gameCode: "snake"
	fruits: Fruit[];
	snakeTeamData: Record<string, SnakeTeam>
	mapArea: MapAreaSelectorValue
	gameStateLogs: GameStateLog<SnakeGameState>[],
}

export type Fruit = {
	coords: {lat: number, lng: number} 
	challenge: SnakeChallenge
}

export type SnakeChallenge = {
	variant: FruitVariant
	title: string,
	description: string,
	emoji: string,
}
export type FruitVariant =  "bring" | "there" | "go_come_back" 

export type SnakeTeam = {
	color: string,
	name: string,
	players: PlayerData[]
	snakeBody: SnakeBody
}

export type SnakeBody = {
	maxLength: number
	timeHorizon: number
	segments: SnakeSegment[]
}

export type SnakeSegment = {lat: number, lng: number, timecode: number}

export type SnakeGameSetupData = {
	mapArea : MapAreaSelectorValue
	gameName: string
	gameTimeMinutes?: number
}