import { Game } from './main';
import { format } from 'date-fns';
import axios from 'axios';

// Display all scores from today - live, scheduled, and completed
export async function todays_scores() {
    try {
        // Create an instance of the Game class
        const game = new Game();

        // Fetch game Pks for the current date
        const gamePks = await game.fetchGamePksForCurrentDate();

        if (gamePks.length === 0) {
            return 'No games scheduled for today.';
        }

        // Fetch game data for the obtained game Pks
        const gameDataArray = await game.fetchGameData(gamePks);

        // Process game data and build the final message with game state sorting
        const gameMessages = await processGameData(gameDataArray);

        // Join all game messages into a single string
        const finalMessage = gameMessages.join('\n');

        return finalMessage;
    } catch (error) {
        console.error('Error fetching today\'s scores:', error);
        return 'An error occurred while fetching today\'s scores.';
    }
}

/**
 * Process game data and build game messages with game state sorting.
 * @param gameDataArray An array of game data.
 * @returns An array of game messages sorted by game state.
 */
async function processGameData(gameDataArray: string[]): Promise<string[]> {
    // Create arrays to separate games by abstract game state
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

        for (let i = 0; i < gameDataArray.length; i++) {
            const gameData = gameDataArray[i];
            const gameState: string = games[i].status.abstractGameState;

            if (gameState === 'Live') {
                live.push(gameData);
            } else if (gameState === 'Preview') {
                scheduled.push(gameData);
            } else if (gameState === 'Final') {
                final.push(gameData);
            } else {
                other.push(gameData);
            }
        }

        // Join and return sorted game messages
        return [...live, ...scheduled, ...final, ...other];
    } catch (error) {
        console.error('Error fetching today\'s games:', error);
        return [];
    }
}