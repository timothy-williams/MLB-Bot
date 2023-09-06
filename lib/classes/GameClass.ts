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
        const map = new Map([
            ['detailedState', gm.gameData.status.detailedState],
            ['abstractState', gm.gameData.status.abstractGameState],
            ['TBD', gm.gameData.status.startTimeTBD]
        ]);

        if (map.get('abstractState') === 'Preview' || 
            map.get('detailedState').startsWith('Warmup')) {
            map.set('condenseStatus', 'Scheduled');
        } else if (map.get('detailedState').startsWith('In Progress')) {
            map.set('condenseStatus', 'Live');
        } else if (map.get('detailedState').startsWith('Delayed')) {
            map.set('condenseStatus', 'Delayed');
        } else if (map.get('detailedState').startsWith('Suspended')) {
            map.set('condenseStatus', 'Suspended');
        } else if (map.get('abstractState') === 'Final') {
            map.set('condenseStatus', 'Final');
        } else {
            map.set('condenseStatus', '???');
        }

        if (('currentInning' in gm.liveData.linescore) && 
            !('resumeDateTime' in gm.gameData.datetime)) {
            map.set('inning', gm.liveData.linescore.currentInning);
        } else {
            map.set('inning', false);
        }

        if (map.get('abstractState') === 'Live') {
            map.set('half', gm.liveData.linescore.inningHalf);
            if (gm.liveData.linescore.inningHalf === 'Bottom') {
                map.set('half', 'Bot');
            };
        } else {
            map.set('half', false);
        }

        if (map.get('abstractState') === 'Final') {
            map.set('gameLength', gm.gameData.gameInfo.gameDurationMinutes);
        } else {
            map.set('gameLength', false);
        }

        return map;
    }

    async getAwayHomeInfo() {
        const gm: Record<any, any> = await this.getGameData();
        const away = gm.gameData.teams.away;
        const home = gm.gameData.teams.home;
        const awayLS = gm.liveData.linescore.teams.away;
        const homeLS = gm.liveData.linescore.teams.home;
        const map = new Map([
            ['awayName', away.clubName],
            ['awayAbbr', away.abbreviation],
            ['awayWin', away.record.leagueRecord.wins],
            ['awayLoss', away.record.leagueRecord.losses],
            ['homeName', home.clubName],
            ['homeAbbr', home.abbreviation],
            ['homeWin', home.record.leagueRecord.wins],
            ['homeLoss', home.record.leagueRecord.losses],
        ]);

        if (('runs' && 'hits' && 'errors') in awayLS) {
            map.set('awayRuns', awayLS.runs);
            map.set('awayHits', awayLS.hits);
            map.set('awayErrors', awayLS.errors);
            map.set('homeRuns', homeLS.runs);
            map.set('homeHits', homeLS.hits);
            map.set('homeErrors', homeLS.errors);
        } else {
            map.set('awayRuns', 0);
            map.set('awayHits', 0);
            map.set('awayErrors', 0);
            map.set('homeRuns', 0);
            map.set('homeHits', 0);
            map.set('homeErrors', 0);
        }

        return map;
    }

    async getDateTime() {
        const gm = await this.getGameData();
        const map = new Map<string, any>([
            ['dateTimeDict', gm.gameData.datetime],
            ['dateTime', gm.gameData.datetime.dateTime]
        ]);

        if ('resumeDateTime' in map.get('dateTimeDict')) {
            map.set('startTime', gm.gameData.datetime.resumeDateTime);
        } else if (('currentInning' in gm.liveData.linescore) &&
            !('resumeDateTime' in map.get('dateTimeDict'))) {
            map.set('startTime', gm.gameData.datetime.firstPitch);
        } else {
            map.set('startTime', gm.gameData.datetime.dateTime);
        }

        return map;
    }

    async getByInning() {
        const gm = await this.getGameData();
        const individualInnings = gm.liveData.linescore.innings
        const map = new Map<string, any>([
            ['awayRunsByInn', {}],
            ['homeRunsByInn', {}]
        ]);

        for (const inn of individualInnings) {
            const away = map.get('awayRunsByInn');
            const home = map.get('homeRunsByInn');

            if ((away) && (home)) {
                away[inn.ordinalNum] = inn.away.runs;
                if ('runs' in inn.home) {
                    home[inn.ordinalNum] = inn.home.runs;
                } else {
                    home[inn.ordinalNum] = 'X';
                }
            }
        }

        return map;
    }
}