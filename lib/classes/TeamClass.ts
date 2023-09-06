import axios from 'axios';

export class Team {
    private teamId: string;
    private teamData: any;
    private endpoint: string;
    private lastGameID: string;

    // Single team endpoint
    constructor(teamId: string) {
        this.teamId = teamId;
        this.endpoint = `https://statsapi.mlb.com/api/v1/teams/${this.teamId}`
    }
    
    // Return general team data
    private async getTeamData() {
        if (!this.teamData) {
            try {
                const res = await axios.get(this.endpoint);
                this.teamData = res.data;
            } catch (error) {
                console.error('Error fetching team data:', error);
                throw error;
            }
        }
        return this.teamData;
    }

    // Returns gamePk of team's most recent completed game
    async getRecentCompletedGameID() {
        if (!this.lastGameID) {
            try {
                const recentGamesEndpoint = `${this.endpoint}?hydrate=previousSchedule`
                const res = await axios.get(recentGamesEndpoint);
                const previousSchedule = res.data.teams[0].previousGameSchedule.dates
                const previousGames: Record<any, any>[] = [];

                for (const d of previousSchedule) {
                    previousGames.push(...d.games.filter((x: { 
                        status: { abstractGameCode: string; }; }) => 
                        x.status.abstractGameCode === "F"));
                }
                
                if (previousGames.length === 0) {
                    return null;
                }
                
                this.lastGameID = (previousGames[previousGames.length - 1].gamePk).toString();
            } catch (error) {
                console.error("Error fetching team's last completed game ID:", error);
                throw error;
            }
        }
        return this.lastGameID;
    }
}