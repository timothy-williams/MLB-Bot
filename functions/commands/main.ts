import axios from 'axios';
import * as emoji from 'node-emoji';
import { getGuildEmojis } from '../utils/EndpointInteractions';
import { getDiscordSecrets } from '../utils/DiscordSecrets';

export class Game {
    private gameId: string;
    private gameData: any;

    // Single game endpoint
    constructor(gameId: string) {
        this.gameId = gameId;
    }

    // Fetch game data if not already fetched, then return the game data
    private async getGameData() {
        if (!this.gameData) {
            try {
                const endpoint = `https://statsapi.mlb.com/api/v1.1/game/${this.gameId}/feed/live`;
                const res = await axios.get(endpoint);
                this.gameData = res.data;
            } catch (error) {
                console.error('Error fetching game data:', error);
                throw error; // Handle the error further up the call stack
            }
        }
        return this.gameData;
    }

    async getStartTime() {
        const gm = await this.getGameData();
        
        if ('resumeDateTime' in gm.gameData.datetime) {
            return gm.gameData.datetime.resumeDateTime;
        } else if (('currentInning' in gm.liveData.linescore) &&
            ! ('resumeDateTime' in gm.gameData.datetime)) {
            return gm.gameData.gameInfo.firstPitch;
        } else {
            return gm.gameData.datetime.dateTime;
        }
    }

    async displayScoreboard() {
        /*
        📅 Status • :team_emoji_1: ABC 0 (100-62) @ :team_emoji_2: XYZ 0 (62-100) • 🕒 12:00 PM PST - Length: 2:30
        */
       
        const gm = await this.getGameData();

        // Game status
        const status: string = gm.gameData.status.detailedState
        const abstract: string = gm.gameData.status.abstractGameState // Preview, Live, Final
        const TBD: boolean = gm.gameData.status.startTimeTBD

        // Away & home team info
        const away = gm.gameData.teams.away;
        const home = gm.gameData.teams.home;

        const awayName: string = away.clubName.toLowerCase().replace(/\s+/g, '');
        const homeName: string = home.clubName.toLowerCase().replace(/\s+/g, '');

        const awayAbbr: string = away.abbreviation;
        const homeAbbr: string = home.abbreviation;

        const awayWin: number = away.record.leagueRecord.wins;
        const awayLoss: number = away.record.leagueRecord.losses;

        const homeWin: number = home.record.leagueRecord.wins;
        const homeLoss: number = home.record.leagueRecord.losses;

        let awayRuns: number;
        let homeRuns: number;

        if ('runs' in gm.liveData.linescore.teams.away) {
            awayRuns = gm.liveData.linescore.teams.away.runs;
            homeRuns = gm.liveData.linescore.teams.home.runs;
        } else {
            awayRuns = 0;
            homeRuns = 0;
        }
        
        // Get custom Discord team emojis from server
        const discordSecret = await getDiscordSecrets();
        const endpointInfo = {
            authToken: discordSecret?.token,
            applicationId: undefined,
            guildId: discordSecret?.guild_id
            };
        const getTeamEmojis = await getGuildEmojis(endpointInfo);
        const teamEmojis = getTeamEmojis.data;
        
        // Assign emojis to relative team
        var awayEmoji = '';
        var homeEmoji = '';
        for (const tm of teamEmojis) {
            if (`mlb_${awayName}` === tm.name) {
                awayEmoji = `<:${tm.name}:${tm.id}>`
            };
            if (`mlb_${homeName}` === tm.name) {
                homeEmoji = `<:${tm.name}:${tm.id}>`
            };
        };
        
        const awayLine = `${awayEmoji} ${awayAbbr} ${awayRuns} (${awayWin}-${awayLoss})`;
        const homeLine = `${homeEmoji} ${homeAbbr} ${homeRuns} (${homeWin}-${homeLoss})`;

        // Assign emojis to game state
        // Condense game state verbiage
        var condenseStatus = '';
        var statusEmoji = '';

        if (abstract === 'Preview' || status.startsWith('Warmup')) {
            condenseStatus = 'Scheduled';
            statusEmoji = emoji.emojify(':date:');
        } else if (status.startsWith('In Progress')) {
            condenseStatus = 'Live';
            statusEmoji = emoji.emojify(':red_circle:');
        } else if (status.startsWith('Delayed')) {
            condenseStatus = 'Delayed';
            statusEmoji = emoji.emojify(':pause_button:');
        } else if (status.startsWith('Suspended')) {
            condenseStatus = 'Suspended';
            statusEmoji = emoji.emojify(':cloud_rain:');
        } else if (abstract === 'Final') {
            condenseStatus = 'Final';
            statusEmoji = emoji.emojify(':checkered_flag:');
        } else {
            condenseStatus = 'Unknown Status';
            statusEmoji = emoji.emojify(':x:');
        }

        // Formatting
        var score = `${statusEmoji} ${condenseStatus} ${awayLine} @ ${homeLine}`;

        // Time conversion for scheduled games
        const schedDT = new Date(gm.gameData.datetime.dateTime);
        var schedPST: string = schedDT.toLocaleString('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
            timeZone: 'America/Los_Angeles'
        });

        const timeEmoji: string = emoji.emojify(":clock3:");

        // Check if game time is to be determind
        if (TBD && abstract === 'Preview') { 
            return `${score} ${timeEmoji} TBD`
        }

        var inning: number = 0;
        var fpPST: string = '';

        if ('resumeDateTime' in gm.gameData.datetime) { // If resuming/resumed
            // Time conversion for previously suspended games
            const resumeDT = new Date(gm.gameData.datetime.resumeDateTime);
            schedPST = resumeDT.toLocaleString('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
                timeZone: 'America/Los_Angeles'
            });
            fpPST = schedPST; // Change first pitch time to resumed time
        } else if (('currentInning' in gm.liveData.linescore) && // If Live
            ! ('resumeDateTime' in gm.gameData.datetime)) {      // but not resumed
            inning = gm.liveData.linescore.currentInning;
            
            // Time conversion for live and completed games
            const fpDT = new Date(gm.gameData.gameInfo.firstPitch);
            fpPST = fpDT.toLocaleString('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
                timeZone: 'America/Los_Angeles'
            });
        } else { // If regular scheduled game
            return `${score} ${timeEmoji} ${schedPST}`;
        }

        // More formatting; current inning, extra innings, etc.
        if (abstract === 'Live') {
            var half: string = gm.liveData.linescore.inningHalf;
            if (half === 'Bottom') {
                half = 'Bot';
            };
            score = `${statusEmoji} ${condenseStatus} • ${half} ${inning} ${awayLine} @ ${homeLine}`;
        } else if (inning > 9 && abstract === 'Final') {
            score = `${statusEmoji} ${condenseStatus} (${inning}) ${awayLine} @ ${homeLine}`;
        }

        let intLength: number;

        if (status.startsWith('Suspended')) {
            return `${score} ${timeEmoji} ${fpPST}`;
        } else if (status.startsWith('Final') || status.startsWith('Game Over')) {
            intLength = gm.gameData.gameInfo.gameDurationMinutes;
        } else {
            return `${score} ${timeEmoji} ${fpPST}`;
        }

        // Length of game in hours and minutes
        const hours: number = Math.floor(intLength / 60);
        const minutes: string = (intLength % 60).toString().padStart(2, '0');
        const length = `${hours}:${minutes}`;

        // Last formatting
        const gameTimeComplete: string = `${timeEmoji} ${fpPST} • Length: ${length}`;
        const finalDetailed: string = `${score} ${gameTimeComplete}`
        return finalDetailed;
    }

    async displayLinescore() {
        /*
        MM/DD/YY |  1   2   3   4   5   6   7   8   9  |  R   H   E
        ---------|-------------------------------------|-------------
        Team 1   |  0   0   0   0   0   0   0   0   0  |  0   0   0 
        Team 2   |  0   0   0   0   0   0   0   0   X  |  0   0   0
        */

        const gm = await this.getGameData();

        const gameDate = new Date(gm.gameData.datetime.dateTime);
        var strDate: string = gameDate.toLocaleDateString('en-US', {
            timeZone: 'America/Los_Angeles'
        });
        const awayName: string = gm.gameData.teams.away.clubName
        const homeName: string = gm.gameData.teams.home.clubName
        const linescoreData = gm.liveData.linescore

        /* Split linescore into 9 sections like a 3x3 grid */

        // Define left third
        var topLeft: string; // Date
        var leftPad: string; // Dash padding below date
        var midLeft: string; // Away team name
        var botLeft: string; // Home team name

        if ((strDate.length >= awayName.length) || // If date is longer
            (strDate.length >= homeName.length)) {
            topLeft = strDate + ' ';
            leftPad = ''.padStart(topLeft.length, '-');
            midLeft = awayName.padEnd(topLeft.length);
            botLeft = homeName.padEnd(topLeft.length);
        } else { // If one of the team names are longer
            if (awayName.length >= homeName.length) {
                midLeft = awayName + ' ';
                topLeft = strDate.padEnd(midLeft.length);
                leftPad = ''.padStart(midLeft.length, '-');
                botLeft = homeName.padEnd(midLeft.length);
            } else {
                botLeft = homeName + ' ';
                topLeft = strDate.padEnd(botLeft.length);
                leftPad = ''.padStart(botLeft.length, '-');
                midLeft = awayName.padEnd(botLeft.length);
            }
        }

        const totalInnings: number = linescoreData.currentInning

        // Define middle third
        let topMid = ''; // Innings
        var midPad: string; // Dash padding below innings
        let midMid = ''; // Away team runs scored by inning
        let botMid = ''; // Home team runs scored by inning

        for (let i = 1; i <= totalInnings; i++) {
            topMid += i + '   '; // 3 spaces between each number
        }

        topMid = `  ${topMid.trimEnd()}  `; // 2 spaces on each side
        midPad = ''.padStart(topMid.length, '-');

        const individualInnings = linescoreData.innings

        for (const inn of individualInnings) {
            midMid += (inn.away.runs).toString() + '   ';

            // Check if home team needed to play the final bottom half
            if (('runs' in inn.home)) {
                botMid += (inn.home.runs).toString() + '   ';
            }
            else {
                botMid += 'X' 
            }         
        }

        midMid = `  ${midMid.trimEnd()}  `;
        botMid = `  ${botMid.trimEnd()}  `;

        // Define right third
        const topRight = '  R   H   E  ';
        const rightPad = ''.padStart(topRight.length, '-');
        
        const awayLinescore = linescoreData.teams.away
        const homeLinescore = linescoreData.teams.home

        const awayRuns: number = awayLinescore.runs
        const awayHits: number = awayLinescore.hits
        const awayErrors : number = awayLinescore.errors

        const homeRuns: number = homeLinescore.runs
        const homeHits: number = homeLinescore.hits
        const homeErrors : number = homeLinescore.errors

        const midRight = `  ${awayRuns}   ${awayHits}   ${awayErrors}`
        const botRight = `  ${homeRuns}   ${homeHits}   ${homeErrors}`

        // Build the linescore
        const topLine = `${topLeft}|${topMid}|${topRight}`;
        const padLine = `${leftPad}|${midPad}|${rightPad}`;
        const midLine = `${midLeft}|${midMid}|${midRight}`;
        const botLine = `${botLeft}|${botMid}|${botRight}`;

        return `${topLine}\n${padLine}\n${midLine}\n${botLine}`;
    }
}

export class Team {
    private teamId: string;
    private teamData: any;
    private endpoint: string;
    private lastGameID: string;

    constructor(teamId: string) {
        this.teamId = teamId;
        this.endpoint = `https://statsapi.mlb.com/api/v1/teams/${this.teamId}`
    }

    // Single team endpoint
    private async getTeamData() {
        if (!this.teamData) {
            try {
                const res = await axios.get(this.endpoint);
                this.teamData = res.data;
            } catch (error) {
                console.error('Error fetching team data:', error);
                throw error; // Handle the error further up the call stack
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

                for (const d of previousSchedule.teams[0].previousGameSchedule.dates) {
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
                throw error; // Handle the error further up the call stack
            }
        }
        return this.lastGameID;
    }
}