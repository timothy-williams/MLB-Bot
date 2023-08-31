import { Game } from './main';
import { format } from 'date-fns';
import axios from 'axios';
import { EmbedStructure, GameMap } from '../../lib/types/discord';

export class ScoresToday implements EmbedStructure {
    todayStr = new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"});
    today = format(new Date(this.todayStr), 'yyyy-MM-dd');

    // Need this function for content()
    async fetchGames() {
        const endpoint = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${this.today}`;
    
        try {
            const res = await axios.get(endpoint);
            return res.data.dates[0].games; // All games from date
        } catch (error) {
            console.error('Error fetching data:', error);
            return [];
        }
    }

    // Today's scores message
    async content() {
        const games = await this.fetchGames();
        const gameMaps: GameMap = {
            Live: new Map(),
            Preview: new Map(),
            Final: new Map(),
            Other: new Map(),
        };

        for (const game of games) {
            const gameState = game.status.abstractGameState;
            const gameClass = new Game(game.gamePk);
            const scoreboard = await gameClass.displayScoreboard();
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

    // MLB Games Today - Month DD, YYYY (PST)
    title() {
        return `MLB Games Today - ${this.today} (PST)`;
    }

    // All MLB scores link
    url() {
        return 'https://www.mlb.com/scores';
    }

    color(): number {
        return 65517;
    }

    // Build embed object
    async buildObject(){
        return {
            description: await this.content(),
            title: this.title(),
            url: this.url(),
            color: this.color()
        };
    }
}