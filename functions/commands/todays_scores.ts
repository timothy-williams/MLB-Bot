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

    // Today's datetime
    const todayStr = new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"});
    const today = format((new Date(todayStr)), 'yyyy-MM-dd');
    const endpoint = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}`;
    
    try {
        const res = await axios.get(endpoint);
        const games = res.data.dates[0].games; // All games from today

        for ( const g of games ) {
            const gameState: string = g.status.abstractGameState;
            const scoreboard = await new Game(g.gamePk).scoreboard();

            // Sort games by game state and retrieve scoreboard() for each
            switch ( gameState ) {
                case "Live":
                    live.push(scoreboard + '\n');
                    break;
                case "Preview":
                    scheduled.push(scoreboard + '\n');
                    break;
                case "Final":
                    final.push(scoreboard + '\n');
                    break;
                default:
                    other.push(scoreboard + '\n');
                    break;
            };
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }

    // Formatting
    const message = [...live, ...scheduled, ...final, ...other].join('\n');
    const finalMessage = message.slice(0, -1);
    
    console.log(`Todays's scores:\n${finalMessage}`);
    return finalMessage;
}