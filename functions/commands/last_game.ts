import { Game, Team } from './main';
import { mlbIDs } from '../constants/TeamIDs';

export async function last_game(teamAbbr: string) {
    const teamID = mlbIDs[teamAbbr];
    const lastGameID = await new Team(teamID).getRecentCompletedGameID();

    if (lastGameID === null) {
        // Handle the case where lastGameID is null (e.g., no recent game found)
        console.log("No recent game found for the team.");
        return "No recent game found for the team.";
    }

    const lastGame = new Game(lastGameID);
    const linescore = await lastGame.displayLinescore();

    console.log(`${teamAbbr}'s last game linescore:\n${linescore}`)
    return linescore;
}