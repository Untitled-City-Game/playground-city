import { games, isGameEnabled } from "@/scripts/consts";
import CreateMatchConnectFour from "@/src/lobby/CreateMatch/CreateMatchConnectFour";
import CreateMatchSnake from "@/src/lobby/CreateMatch/CreateMatchSnake";
import P from "@/src/userInterface/P";
import { useParams } from "react-router";

export default function CreateMatch(){
	const gameCode = useParams().gameCode;
	// The game picker hides disabled games; this covers a typed-in link.
	// Joining an existing match is still allowed.
	const game = games.find(game => game.code === gameCode);
	if (game && !isGameEnabled(game)) {
		return <P>{game.name} isn't available yet.</P>
	}
	switch(gameCode){
		case 'connect_four':
			return <CreateMatchConnectFour />
		case 'snake':
			return <CreateMatchSnake />
	}
}
