// App.tsx
import LobbyLanding from "@/src/lobby/LobbyLanding";
import JoinMatch from "@/src/lobby/JoinMatch";
import LobbyLayout from "@/src/lobby/LobbyLayout";
import ChooseGame from "@/src/site/ChooseGame";
import ExampleMap from "@/src/site/ExampleMap";
import OuterLayout from "@/src/site/outerLayout";
import NotFound from "@/src/match/screens/game_status/NotFound";
import RootLayout from "@/src/userInterface/RootLayout";
import { BrowserRouter, Route, Routes } from "react-router";
import Match from "@/src/match/Match";
import CreateMatch from "@/src/lobby/CreateMatch/CreateMatch";
import MatchClient from "@/src/match/Client";
import NotificationTest from "@/src/site/NotificationTest";
import ConnectFourDemo from "@/src/match/demo/ConnectFourDemo";
import ReviewLayout from "@/src/review/ReviewLayout";
import ReviewUpload from "@/src/review/ReviewUpload";
import ReviewMatch from "@/src/review/ReviewMatch";

export default function AppRouter(){
	return (
	<BrowserRouter>
		<Routes>
			<Route element={<RootLayout />}>
				<Route path="demo/connect4" element={<ConnectFourDemo />} />
				<Route element={<OuterLayout />}>
					<Route path="notification" element={<NotificationTest />} />
					<Route index element={<ChooseGame />} />
					<Route path="map" element={<ExampleMap />} />
				</Route>
				<Route path="/match" element={<MatchClient />} />
				<Route path="review" element={<ReviewLayout />}>
					<Route index element={<ReviewUpload />} />
					<Route path=":matchID" element={<ReviewMatch />} />
				</Route>
				<Route path="lobby" element={<LobbyLayout />}>
					<Route path=":gameCode/join-match/:matchID" element={<JoinMatch />} />
					<Route path=":gameCode/create-match" element={<CreateMatch />} />
					<Route path=":gameCode/choose-match" element={<LobbyLanding />} />
				</Route>
				<Route path="*" element={<NotFound />} />
			</Route>
		</Routes>
	</BrowserRouter>
	)
}

