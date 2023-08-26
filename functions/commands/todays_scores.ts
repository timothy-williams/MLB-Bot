import { Game } from './main';
import { format } from 'date-fns';
import axios from 'axios';

// Display all scores from today - live, scheduled, and completed
export async function todays_scores() {
    // Create array for each abstracted game state
    const live: string[] = [];
    const scheduled: string[] = [];
    const final: string[] = [];
    const other: string[] = [];
    var liveMap = new Map<string, string>();
    var schedMap = new Map<string, string>();
    var finalMap = new Map<string, string>();
    var otherMap = new Map<string, string>();

    // Today's datetime
    const todayStr = new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"});
    const today = format((new Date(todayStr)), 'yyyy-MM-dd');
    const endpoint = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}`;
    
    try {
        const res = await axios.get(endpoint);
        const games = res.data.dates[0].games; // All games from date

        for ( const g of games ) {
            const gameState: string = g.status.abstractGameState;
            const gameClass = new Game(g.gamePk);
            const scoreboard = await gameClass.scoreboard();
            const getTime = await gameClass.getStartTime();

            // Sort games by game state and time
            // Retrieve scoreboard() for each
            switch ( gameState ) {
                case "Live":
                    liveMap.set(scoreboard, getTime);
                    break;
                case "Preview":
                    schedMap.set(scoreboard, getTime);
                    break;
                case "Final":
                    finalMap.set(scoreboard, getTime);
                    break;
                default:
                    otherMap.set(scoreboard, getTime);
                    break;
            };
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }

    liveMap = new Map([...liveMap.entries()].sort((a, b) => a[1].localeCompare(b[1])))
    schedMap = new Map([...schedMap.entries()].sort((a, b) => a[1].localeCompare(b[1])))
    finalMap = new Map([...finalMap.entries()].sort((a, b) => a[1].localeCompare(b[1])))
    otherMap = new Map([...otherMap.entries()].sort((a, b) => a[1].localeCompare(b[1])))
    for (let key of liveMap.keys()) {
        live.push(key);
    }
    for (let key of schedMap.keys()) {
        scheduled.push(key);
    }
    for (let key of finalMap.keys()) {
        final.push(key);
    }
    for (let key of otherMap.keys()) {
        other.push(key);
    }

    // Formatting
    const message = [...live, ...scheduled, ...final, ...other].join('\n');
    
    console.log(`Todays's scores:\n${message}`);
    return message;
}