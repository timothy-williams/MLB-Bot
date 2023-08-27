import { Game } from './main';
import { format } from 'date-fns';
import axios from 'axios';

interface GameMap {
    [key: string]: Map<string, string>;
}

async function fetchGames() {
    const todayStr = new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"});
    const today = format(new Date(todayStr), 'yyyy-MM-dd');
    const endpoint = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}`;

    try {
        const res = await axios.get(endpoint);
        return res.data.dates[0].games; // All games from date
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
}

export async function todays_scores() {
    const games = await fetchGames();
    const gameMaps: GameMap = {
        Live: new Map(),
        Preview: new Map(),
        Final: new Map(),
        Other: new Map(),
    };

    for (const game of games) {
        const gameState = game.status.abstractGameState;
        const gameClass = new Game(game.gamePk);
        const scoreboard = await gameClass.scoreboard();
        const getTime = await gameClass.getStartTime();

        gameMaps[gameState]?.set(scoreboard, getTime);
    }

    const sortedGames = {
        Live: [...gameMaps.Live.entries()].sort((a, b) => a[1].localeCompare(b[1])),
        Preview: [...gameMaps.Preview.entries()].sort((a, b) => a[1].localeCompare(b[1])),
        Final: [...gameMaps.Final.entries()].sort((a, b) => a[1].localeCompare(b[1])),
        Other: [...gameMaps.Other.entries()].sort((a, b) => a[1].localeCompare(b[1])),
    };

    const formattedGames = Object.values(sortedGames).flatMap(
        (entries) => entries.map(([scoreboard]) => scoreboard));

    const message = formattedGames.join('\n');

    console.log(`Today's scores:\n${message}`);
    return message;
}