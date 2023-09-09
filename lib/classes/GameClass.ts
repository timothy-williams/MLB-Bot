import axios from 'axios';

export class Game {
    private gameId: string;
    private gameData: any;
    private endpoint: string;

    // Single game endpoint
    constructor(gameId: string) {
        this.gameId = gameId;
        this.endpoint = `https://statsapi.mlb.com/api/v1.1/game/${this.gameId}/feed/live`;
    }

    // Fetch game data if not already fetched, then return the game data
    private async getGameData() {
        if (!this.gameData) {
            try {
                const res = await axios.get(this.endpoint);
                this.gameData = res.data;
            } catch (error) {
                console.error('Error fetching game data:', error);
                throw error;
            }
        }
        return this.gameData;
    }

    async getGameState() {
        const gm: Record<any, any> = await this.getGameData();
        const gameState: Record<string, any> = {
            detailedState: gm.gameData.status.detailedState,
            abstractState: gm.gameData.status.abstractGameState,
            TBD: gm.gameData.status.startTimeTBD,
        };

        if (gameState['abstractState'] === 'Preview' || gameState['detailedState'].startsWith('Warmup')) {
            gameState['condenseStatus'] = 'Scheduled';
        } else if (gameState['detailedState'].startsWith('In Progress')) {
            gameState['condenseStatus'] = 'Live';
        } else if (gameState['detailedState'].startsWith('Delayed')) {
            gameState['condenseStatus'] = 'Delayed';
        } else if (gameState['detailedState'].startsWith('Suspended')) {
            gameState['condenseStatus'] = 'Suspended';
        } else if (gameState['abstractState'] === 'Final') {
            gameState['condenseStatus'] = 'Final';
        } else {
            gameState['condenseStatus'] = '???';
        }

        if ('currentInning' in gm.liveData.linescore && !('resumeDateTime' in gm.gameData.datetime)) {
            gameState['inning'] = gm.liveData.linescore.currentInning;
        } else {
            gameState['inning'] = false;
        }

        if (gameState['abstractState'] === 'Live') {
            gameState['half'] = gm.liveData.linescore.inningHalf;
            if (gm.liveData.linescore.inningHalf === 'Bottom') {
                gameState['half'] = 'Bot';
            }
        } else {
            gameState['half'] = false;
        }

        if (gameState['abstractState'] === 'Final') {
            gameState['gameLength'] = gm.gameData.gameInfo.gameDurationMinutes;
        } else {
            gameState['gameLength'] = false;
        }

        return gameState;
    }

    async getAwayHomeInfo() {
        const gm = await this.getGameData();
        const away = gm.gameData.teams.away;
        const home = gm.gameData.teams.home;
        const awayLS = gm.liveData.linescore.teams.away;
        const homeLS = gm.liveData.linescore.teams.home;
        const awayHomeInfo: Record<string, any> = {
            awayName: away.clubName,
            awayAbbr: away.abbreviation,
            awayWin: away.record.leagueRecord.wins,
            awayLoss: away.record.leagueRecord.losses,
            homeName: home.clubName,
            homeAbbr: home.abbreviation,
            homeWin: home.record.leagueRecord.wins,
            homeLoss: home.record.leagueRecord.losses,
        };

        if ('runs' in awayLS) {
            awayHomeInfo['awayRuns'] = awayLS.runs;
            awayHomeInfo['awayHits'] = awayLS.hits;
            awayHomeInfo['awayErrors'] = awayLS.errors;
            awayHomeInfo['homeRuns'] = homeLS.runs;
            awayHomeInfo['homeHits'] = homeLS.hits;
            awayHomeInfo['homeErrors'] = homeLS.errors;
        } else {
            awayHomeInfo['awayRuns'] = 0;
            awayHomeInfo['awayHits'] = 0;
            awayHomeInfo['awayErrors'] = 0;
            awayHomeInfo['homeRuns'] = 0;
            awayHomeInfo['homeHits'] = 0;
            awayHomeInfo['homeErrors'] = 0;
        }

        return awayHomeInfo;
    }

    async getDateTime() {
        const gm = await this.getGameData();
        const dateTimeInfo: Record<string, any> = {
            dateTimeDict: gm.gameData.datetime,
            dateTime: gm.gameData.datetime.dateTime
        };

        if ('resumeDateTime' in dateTimeInfo['dateTimeDict']) {
            dateTimeInfo['startTime'] = gm.gameData.datetime.resumeDateTime;
        } else if ('firstPitch' in dateTimeInfo['dateTimeDict'] && !('resumeDateTime' in dateTimeInfo['dateTimeDict'])) {
            dateTimeInfo['startTime'] = gm.gameData.datetime.firstPitch;
        } else {
            dateTimeInfo['startTime'] = gm.gameData.datetime.dateTime;
        }

        return dateTimeInfo;
    }

    async getByInning() {
        const gm = await this.getGameData();
        const individualInnings = gm.liveData.linescore.innings;
        const inningsByTeam: Record<string, any> = {
            awayRunsByInn: {},
            homeRunsByInn: {},
        };

        for (const inn of individualInnings) {
            inningsByTeam.awayRunsByInn[inn.ordinalNum] = inn.away.runs;

            if ('runs' in inn.home) {
                inningsByTeam.homeRunsByInn[inn.ordinalNum] = inn.home.runs;
            } else {
                inningsByTeam.homeRunsByInn[inn.ordinalNum] = 'X';
            }
        }

        return inningsByTeam;
    }
}
