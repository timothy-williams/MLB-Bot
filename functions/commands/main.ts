import axios from 'axios';
import * as emoji from 'node-emoji';
import { getGuildEmojis } from '../utils/EndpointInteractions';
import { getDiscordSecrets } from '../utils/DiscordSecrets';

export class Game {
    private gamePk: string;
    private gameData: any;

    // Single game endpoint
    constructor(gamePk: string) {
        this.gamePk = gamePk;
    }

    // Fetch game data if not already fetched, then return the game data
    private async getGameData() {
        if (!this.gameData) {
            try {
                const endpoint = `https://statsapi.mlb.com/api/v1.1/game/${this.gamePk}/feed/live`;
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
        
        if ( 'resumeDateTime' in gm.gameData.datetime ) {
            return gm.gameData.datetime.resumeDateTime;
        } else if ( ( 'currentInning' in gm.liveData.linescore ) &&
            ! ( 'resumeDateTime' in gm.gameData.datetime ) ) {
            return gm.gameData.gameInfo.firstPitch;
        } else {
            return gm.gameData.datetime.dateTime;
        }
    }

    // 📅 Status • :team_emoji_1: ABC 0 (100-62) @ :team_emoji_2: XYZ 0 (62-100) • 🕒 12:00 PM PST - Length: 2:30
    async scoreboard() {
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

        if ( 'runs' in gm.liveData.linescore.teams.away ) {
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
        for ( const tm of teamEmojis ) {
            if ( `mlb_${awayName}` === tm.name ) {
                awayEmoji = `<:${tm.name}:${tm.id}>`
            };
            if ( `mlb_${homeName}` === tm.name ) {
                homeEmoji = `<:${tm.name}:${tm.id}>`
            };
        };
        
        const awayLine = `${awayEmoji} ${awayAbbr} ${awayRuns} (${awayWin}-${awayLoss})`;
        const homeLine = `${homeEmoji} ${homeAbbr} ${homeRuns} (${homeWin}-${homeLoss})`;

        // Assign emojis to game state
        // Condense game state verbiage
        var condenseStatus = '';
        var statusEmoji = '';

        if ( abstract === 'Preview' || status.startsWith('Warmup') ) {
            condenseStatus = 'Scheduled';
            statusEmoji = emoji.emojify(':date:');
        } else if ( status.startsWith('In Progress')) {
            condenseStatus = 'Live';
            statusEmoji = emoji.emojify(':red_circle:');
        } else if ( status.startsWith('Delayed') ) {
            condenseStatus = 'Delayed';
            statusEmoji = emoji.emojify(':pause_button:');
        } else if ( status.startsWith('Suspended') ) {
            condenseStatus = 'Suspended';
            statusEmoji = emoji.emojify(':cloud_rain:');
        } else if ( abstract === 'Final' ) {
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
        if ( TBD && abstract === 'Preview' ) { 
            return `${score} ${timeEmoji} TBD`
        }

        var inning: number = 0;
        var fpPST: string = '';

        if ( 'resumeDateTime' in gm.gameData.datetime ) { // If resuming/resumed
            // Time conversion for previously suspended games
            const resumeDT = new Date(gm.gameData.datetime.resumeDateTime);
            schedPST = resumeDT.toLocaleString('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
                timeZone: 'America/Los_Angeles'
            });
            fpPST = schedPST; // Change first pitch time to resumed time
        } else if ( ( 'currentInning' in gm.liveData.linescore ) && // If Live
            ! ( 'resumeDateTime' in gm.gameData.datetime ) ) {      // but not resumed
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
        if ( abstract === 'Live' ) {
            var half: string = gm.liveData.linescore.inningHalf;
            if ( half === 'Bottom' ) {
                half = 'Bot';
            };
            score = `${statusEmoji} ${condenseStatus} • ${half} ${inning} ${awayLine} @ ${homeLine}`;
        } else if ( inning > 9 && abstract === 'Final' ) {
            score = `${statusEmoji} ${condenseStatus} (${inning}) ${awayLine} @ ${homeLine}`;
        }

        let intLength: number;

        if ( status.startsWith('Suspended') ) {
            return `${score} ${timeEmoji} ${fpPST}`;
        } else if ( status.startsWith('Final') || status.startsWith('Game Over') ) {
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
}