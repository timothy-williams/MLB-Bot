import { Team } from '../../lib/classes/TeamClass';
import { formatLinescore } from '../format/linescore';
import { mlbIDs } from '../constants/MLBProps';
import { EmbedStructure } from '../../lib/types/discord';

export class LastGame implements EmbedStructure {
    private lastGameID: string | null;

    // Linescore message
    async content(teamAbbr: string) {
        const teamID = mlbIDs[teamAbbr];
        this.lastGameID = await new Team(teamID).getRecentCompletedGameID();

        if (this.lastGameID === null) {
            // Handle the case where lastGameID is null (e.g., no recent game found)
            console.log("No recent game found for the team.");
            return "No recent game found for the team.";
        }

        const linescore = await formatLinescore(this.lastGameID);

        console.log(`${teamAbbr}'s last game linescore:\n${linescore}`)
        return "```" + linescore + "```";
    }

    // "{TeamAbbr}'s last completed game"
    title(teamAbbr: string) {
        return `${teamAbbr}'s last completed game`;
    }

    // Gameday link
    // https://www.mlb.com/gameday/{gamePk}
    url() {
        return `https://www.mlb.com/gameday/${this.lastGameID}`;
    }

    color() {
        return 65517;
    }

    // Build embed object
    async buildObject(teamAbbr: string) {
        return {
            description: await this.content(teamAbbr),
            title: this.title(teamAbbr),
            url: this.url(),
            color: this.color()
        };
    }
}