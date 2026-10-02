import { SnakeContext } from "@/src/match/Board";
import LocationPig, { locationPigContext } from "@/src/match/googleMaps/LocationPig";
import { Polygon } from "@/src/match/googleMaps/shapes/Polygon";
import VisGlMapElement from "@/src/match/googleMaps/VisGLMapElement";
import { useContext, useState } from "react";
import * as turf from '@turf/turf';
import FruitManager from "@/src/match/components/snake/FruitManager";
import SnakeBody from "@/src/match/components/snake/SnakeBody";
import TransitOverlay from "@/src/match/components/transit/LazyTransitOverlay";
const boxSize = 10
export default function SnakeMap(){
	const SnakeGameState = useContext(SnakeContext)
	const {gameLocation, gameRadius} = SnakeGameState.mapArea
	const [playerLocation, setPlayerLocation] = useState(gameLocation)
	const outerCoords = [
		{lat: gameLocation.lat - boxSize, lng: gameLocation.lng - boxSize},
		{lat: gameLocation.lat - boxSize, lng: gameLocation.lng + boxSize},
		{lat: gameLocation.lat + boxSize, lng: gameLocation.lng + boxSize},
		{lat: gameLocation.lat + boxSize, lng: gameLocation.lng - boxSize}
	]
	const circle = turf.circle([gameLocation.lng, gameLocation.lat], gameRadius, { steps: 500, units: "meters"});
	console.log("circle geometry", circle)
	const innerCoords = circle.geometry.coordinates[0].map(([lng, lat]) => ({
		lat,
		lng
	}));
	const [west, south, east, north] = turf.bbox(circle)
	const transitBounds = { south, west, north, east }
	const snakeBodies = Object.keys(SnakeGameState.snakeTeamData).map(teamName => {
		const teamData = SnakeGameState.snakeTeamData[teamName]
		return <SnakeBody key={teamName} teamData={teamData}/>
	})

	return (
		<>
		<VisGlMapElement center={SnakeGameState.mapArea.gameLocation}>
			<locationPigContext.Provider value={[playerLocation, setPlayerLocation]}>
				<LocationPig initialPosition={{lat: 45.45325550549896, lng: 9.168425264500426}} />
				<Polygon
					paths={[
						outerCoords,
						innerCoords.reverse()
					]}
				/>
				<TransitOverlay bounds={transitBounds} />
				{snakeBodies}
				<FruitManager playerLocation={playerLocation} />
			</locationPigContext.Provider>
		</VisGlMapElement>
		</>
	)
}