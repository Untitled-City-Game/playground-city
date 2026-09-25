import { GiRadarSweep } from "react-icons/gi";
import { MdGrid4X4 } from "react-icons/md";
import { PiPersonSimpleRunBold } from "react-icons/pi";
import { VscSnake } from "react-icons/vsc";

export const EXPIRE_TIME = 5000;
export const ACCURACY_MAX = 300;
export const numPlayers = 6;
export const gameTimeMinutes = 180;
// Limits how far the user can zoom out. Zoom 11 ≈ 50km across at mid-latitudes on a typical viewport.
export const mapMinZoom = 11;
export const cities = [
    "melbourne",
    "montreal",
    "london",
    "nyc"
] as const;

// Sentinel "city" for a map the player supplied themselves via a Google My Maps
// link. It has no entry in `maps` or `gameLocationCenters` — its KML id and
// centre travel on the MatchMapData instead.
export const CUSTOM_CITY = "custom";

export const maps = {
    melbourne: {
        name: "Melbourne",
        code: "melbourne",
        kml_live_id: "1h1mLlEU1PRRbiF9eusZUplFhg7wjCaU",
    },
    montreal: {
        name: "Montreal",
        code: "montreal",
        kml_live_id: "1bliTnqrqX9A6txnta7C27Em0PJ3phzE",
    },
    // montreal_mini: {
    //     name: "Montreal mini",
    //     code: "montreal_mini",
    //     kml_live_id: "1RCl4vAXoYFF8HCwX7wTAVlgSs765ZJk"
    // },
    london: {
        name: "London",
        code: "london",
        kml_live_id: "1DWUN7rKm1FUFr0BiKme7f0NpqegZWos",
    },
    nyc: {
        name: "Manhattan",
        code: "nyc",
        kml_live_id: "1L42PLDup2h_AiMSNTT1hAdBoyE5P6Ig"
    }
}

export const gameLocationCenters = {
    melbourne: {
        lat: -37.8136,
        lng: 144.9631
    },
    montreal: {
        lat: 45.5070113731678,
        lng: -73.57570671343632,
    },
    london: {
        lat: 51.5073509,
        lng: -0.1277583,
    },
    // montreal_mini: {
    //     lat: 45.5070113731678,
    //     lng: -73.57570671343632,
    // },
    nyc: {
        lat: 40.74807572237176,
        lng: -73.98590688638745
    }
}

//games
export const games = [
    {
        name: "Connect Four",
        code: "connect_four",
        active: true,
        description: "Connect four neighbourhoods in your city before the other team!",
        playerMin: 4,
        playerMax: 8,
        color: "yellow",
        icon: MdGrid4X4
    },
    {
        name: "Snake",
        code: "snake",
        active: false,
        playerMin: 4,
        playerMax: 8,
        description: "Collect the fruit to grow your snake. Wrap around the other team to win!",
        color: "green",
        icon: VscSnake
    },
    {
        name: "Tag",
        code: "tag",
        active: false,
        playerMin: 6,
        playerMax: 30,
        description: "Explore the city and dodge the taggers - or chase your friends!",
        color: "purple",
        icon: PiPersonSimpleRunBold
    },
    {
        name: "Battleship",
        code: "battleship",
        active: false,
        playerMin: 4,
        playerMax: 8,
        description: "Find and destroy the other team before they find you!",
        color: "water",
        icon: GiRadarSweep
    },
]

//Montreal

//   const center = {
// 	lat:  45.529819917244254,
// 	lng: -73.60361034602055,
//   }