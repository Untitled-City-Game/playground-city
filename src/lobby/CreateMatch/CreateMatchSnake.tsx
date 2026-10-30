import { cities, maps } from "@/scripts/consts";
import { fetchMapData } from "@/scripts/fetchMapData";
import { City, NamedColor, MatchMapData } from "@/scripts/types/types";
import CreateMatchTemplate, { createGameFormConstructor, FormValues } from "@/src/lobby/CreateMatch/CreateMatchTemplate";
import { MapAreaSelector, MapAreaSelectorValue } from "@/src/lobby/CreateMatch/MapAreaSelector";
import P from "@/src/userInterface/P";
import { Select } from "@mantine/core";
import { useState } from "react";

export default function CreateMatchSnake() {
	const teamOptions = ["pink", "aqua"];

	//Setup mantine form
	const createGameForm = createGameFormConstructor(
		{
		mapArea : {
			gameLocation : {lat: 0, lng: 0},
			gameRadius: 3000
		}
		},
		{}, 
		teamOptions,
		"snake"
	)

	interface SnakeFormValues extends FormValues {}
	

	const [mapArea, setMapArea] = useState<MapAreaSelectorValue>({gameLocation: {lat: 0, lng: 0}, gameRadius: 3000});

	const SnakeSetupData = async (values: SnakeFormValues) => {
		const setupData = {
			mapArea,
			gameName: values.gameName
		}
		return setupData;
	};
	return (
		<CreateMatchTemplate 
			teamOptions={teamOptions}
			gameCode={"snake"} getSetupData={SnakeSetupData} 
			createGameForm={createGameForm}			
		>
		<MapAreaSelector 
			mapAreaCallback={setMapArea}
		/>
		</CreateMatchTemplate>
	);
}