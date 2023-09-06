import axios from 'axios';

export class Standings {
    private leagueId: string; // American League = 103, National League = 104
    private endpoint: string;
    private standingsData: string;

    // League standings for East, Central, West divisions, including Wild Card
    constructor(leagueId: string) {
        this.leagueId = leagueId;
        this.endpoint = `https://statsapi.mlb.com/api/v1/standings?leagueId=${leagueId}&standingsType=wildCardWithLeaders`;
    }

    // Return general standings data
    private async getStandingsData() {
        if (!this.standingsData) {
            try {
                const res = await axios.get(this.endpoint);
                this.standingsData = res.data;
            } catch (error) {
                console.error('Error fetching standings data:', error);
                throw error;
            }
        }
        return this.standingsData;
    }
}