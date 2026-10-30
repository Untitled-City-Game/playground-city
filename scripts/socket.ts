import { io } from 'socket.io-client';

// "undefined" means the URL will be computed from the `window.location` object
const URL = process.env.GAME_SERVER
// Connected by the hooks that use it, so screens that only import the board
// (like /review) never open a connection.
export const socket = io(URL, {
	path: process.env.LOCATION_SERVER_PATH,
	autoConnect: false,
});