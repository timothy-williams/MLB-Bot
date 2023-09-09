import axios from 'axios';
import { Team } from './TeamClass';

export class Standings {
    private leagueId: string; // American League = 103, National League = 104
    private endpoint: string;
    private standingsData: any;

    constructor(leagueId: string) {
        this.leagueId = leagueId;
        this.endpoint = `https://statsapi.mlb.com/api/v1/standings?leagueId=${leagueId}&standingsType=`;
    }

    // Return general standings data
    private async getDivisionStandingsData() {
        if (!this.standingsData) {
            try {
                const res = await axios.get(`${this.endpoint}byDivision`);
                this.standingsData = res.data;
            } catch (error) {
                console.error('Error fetching standings data:', error);
                throw error;
            }
        }
        return this.standingsData;
    }

    // Return Wild Card standings data
    private async getWildCardStandingsData() {
        if (!this.standingsData) {
            try {
                const res = await axios.get(`${this.endpoint}wildCard`);
                this.standingsData = res.data;
            } catch (error) {
                console.error('Error fetching standings data:', error);
                throw error;
            }
        }
        return this.standingsData;
    }

    async getWildCardStandings() {
        const stands = await this.getWildCardStandingsData();
        const wildCard = stands.records[0];
        const wildCardObj: Record<string, any> = {
            league: this.leagueId,
            standingsType: wildCard.standingsType,
            teams: {},
        };

        for (const team of wildCard.teamRecords) {
            const teamObj = wildCardObj.teams
            const teamInfo = await new Team((team.team.id).toString()).getTeamInfo();
            const teamAbbreviation = teamInfo.teamAbbr;

            teamObj[teamAbbreviation] = {
                teamName: teamInfo.teamName,
                teamWins: team.wins,
                teamLosses: team.losses,
                WLPercent: team.winningPercentage, // string
                wildCardGB: team.wildCardGamesBack,
                wildCardElimNum: team.wildCardEliminationNumber, // "-" or integer
            };

            if ('wildCardLeader' in team) {
                teamObj[teamAbbreviation]['wildCardLeader'] = true;
            } else {
                teamObj[teamAbbreviation]['wildCardLeader'] = false;
            }
        }

        return wildCardObj;
    }

    async getDivisionStandings(divisionId: string) {
        const stands = await this.getDivisionStandingsData();
        const records = stands.records;

        for (const key of records) {
            if ((key.division.id).toString() === divisionId) {
                const divisionObj: Record<string, any> = {
                    league: this.leagueId,
                    standingsType: key.standingsType,
                    teams: {},
                };

                for (const team of key.teamRecords) {
                    const teamObj = divisionObj.teams
                    const teamInfo = await new Team(team.team.id).getTeamInfo();
                    const teamAbbreviation = teamInfo.teamAbbr;

                    teamObj[teamAbbreviation] = {
                        teamName: teamInfo.teamName,
                        teamWins: team.wins,
                        teamLosses: team.losses,
                        WLPercent: team.winningPercentage, // string
                        gamesBack: team.gamesBack,
                        wildCardGB: team.wildCardGamesBack,
                        elimNum: team.eliminationNumberDivision, // "-" or integer
                    };

                    if ('divisionLeader' in team) {
                        teamObj[teamAbbreviation]['divisionLeader'] = true;
                    } else {
                        teamObj[teamAbbreviation]['divisionLeader'] = false;
                    }
                }

                return divisionObj;
            }
        }
    }
}