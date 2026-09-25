import { ConnectFour } from '@scripts/games/connect_four/connect_four';
import { FlatFile, Origins, Server } from 'boardgame.io/server';
import { Snake } from '@scripts/games/snake/snake';
import { Server as IOServer } from 'socket.io';
const authenticateCredentials = async () => {
    return true;
}


async function buildServer() {
    console.log("building server", process.env.GAME_ADDRESS, process.env.LAN_ADDRESS, process.env.GAME_SERVER);
    const server = Server({
        games: [ConnectFour, Snake],
        authenticateCredentials,
        origins: [Origins.LOCALHOST, "http://localhost:1234", process.env.GAME_ADDRESS || false],
        db: new FlatFile({
            dir: process.cwd() + '/server/db',
        }),
    });

    server.router.get('/hello', (ctx) => {
        ctx.body = `Hello! Running server for STAGING env of Playground City at http://localhost:1234, ${Origins.LOCALHOST} and ${process.env.GAME_ADDRESS}`;
    });
    server.router.get('/map-data/:citycode', async (ctx) => {
        console.log("getting map data for city", ctx.params.citycode);
        // Players can supply their own My Maps id here, so check the shape before
        // it goes anywhere near the URL we build.
        if (!/^[A-Za-z0-9_-]{10,128}$/.test(ctx.params.citycode)) {
            ctx.status = 400;
            ctx.body = { error: 'Invalid map id' };
            return;
        }
        console.log("at url", `https://www.google.com/maps/d/u/0/kml?forcekml=1&mid=${ctx.params.citycode}`)
        try {
            const mapData = await fetch(`https://www.google.com/maps/d/u/0/kml?forcekml=1&mid=${ctx.params.citycode}`);
            console.log("got a response")
            if (!mapData.ok) {
                console.error(`Failed to fetch map data: ${mapData.status} ${mapData.statusText}`);
                ctx.status = mapData.status === 404 ? 404 : 502;
                ctx.body = { error: 'Failed to retrieve map data' };
                return;
            }
            console.log("response is ok!")
            ctx.body = await mapData.text();
            return;
        } catch (error) {
            console.error('Error fetching map data:', error);
            ctx.status = 500;
            ctx.body = { error: 'Internal server error' };
        }
    });
    const PORT = parseInt(process.env.SERVER_PORT || "8989");
    const { appServer } = await server.run(PORT, () => console.log("server running..."));

    const locationIO = new IOServer(appServer, {
        path: process.env.LOCATION_SERVER_PATH,
        cors: {
            origin: [Origins.LOCALHOST, process.env.LAN_ADDRESS || false, process.env.GAME_ADDRESS || false],
            methods: ["GET", "POST"],
        },
    });

    locationIO.on('connection', (socket) => {
        console.log('a user connected');
        let joinedMatch: string | undefined;

        // Clients join a room named after their matchID so location updates
        // are only delivered to players in the same match.
        socket.on("joinMatch", (matchID: string) => {
            if (!matchID) return;
            if (joinedMatch && joinedMatch !== matchID) {
                socket.leave(joinedMatch);
            }
            joinedMatch = matchID;
            socket.join(matchID);
            console.log(`socket ${socket.id} joined match ${matchID}`);
        });

        socket.on('disconnect', () => {
            console.log('user disconnected');
        });

        socket.on("locationUpdate", (body) => {
            if (!body || !body.matchID) return;
            // Send only to other players in the same match (excludes sender).
            socket.to(body.matchID).emit("locationUpdate", body);
        });
    });
}

buildServer();