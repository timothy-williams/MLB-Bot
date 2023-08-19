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
    const today: string = format(new Date(), 'yyyy-MM-dd');
    const todayVerbose: string = `**${format(new Date(), 'MMMM d, yyyy')}**`;
    const endpoint: string = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}`;
    
    try {
        const res = await axios.get(endpoint);
        const games = res.data.dates[0].games; // All games from today

        for (const g of games) {
            const gameState: string = g.status.abstractGameState;
            const scoreboard = await new Game(g.gamePk).scoreboard();

            // Sort games by game state and retrieve scoreboard() for each
            if (gameState === 'Live') {
                live.push(scoreboard + '\n');
            } else if (gameState === 'Preview') {
                scheduled.push(scoreboard + '\n');
            } else if (gameState === 'Final') {
                final.push(scoreboard + '\n');
            } else {
                other.push(scoreboard + '\n');
            }
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }

    // Formatting
    const diff: number = Math.floor((86 - todayVerbose.length) / 2);
    const padding: string = '-'.repeat(diff);
    const todayMsg: string = `${padding}${todayVerbose}${padding}`;
    const message: string = `${todayMsg}\n${[...live, ...scheduled, ...final, ...other].join('\n')}`;
    const finalMessage: string = message.slice(0, -1);
    
    return finalMessage;
}