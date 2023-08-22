import axios from 'axios';
import * as emoji from 'node-emoji';
import { getGuildEmojis } from '../utils/EndpointInteractions';
import { getDiscordSecrets } from '../utils/DiscordSecrets';

export class Game {
    private gamePk: string;
    private endpoint: string;

    // Single game endpoint
    constructor(gamePk: string) {
        this.gamePk = gamePk;
        this.endpoint = `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`;
    }

    // 📅 Status • :team_emoji_1: ABC 0 (100-62) @ :team_emoji_2: XYZ 0 (62-100) • 🕒 12:00 PM LT - Length: 2:30
    async scoreboard() {
        try {
            const res = await axios.get(this.endpoint);
            const gm = res.data

            // Game status
            const status: string = gm.gameData.status.detailedState
            const abstract: string = gm.gameData.status.abstractGameState // Preview, Live, Final

            // Away & home team info
            const away = gm.gameData.teams.away;
            const home = gm.gameData.teams.home;
            const awayName = away.clubName.toLowerCase().replace(/\s+/g, '');
            const homeName = home.clubName.toLowerCase().replace(/\s+/g, '');
            const awayAbbr: string = away.abbreviation;
            const homeAbbr: string = home.abbreviation;
            const awayWin: number = away.record.leagueRecord.wins;
            const awayLoss: number = away.record.leagueRecord.losses;
            const homeWin: number = home.record.leagueRecord.wins;
            const homeLoss: number = home.record.leagueRecord.losses;

            console.log(awayName);
            console.log(homeName);

            let awayRuns: number;
            let homeRuns: number;

            if ('runs' in gm.liveData.linescore.teams.away) {
                awayRuns = gm.liveData.linescore.teams.away.runs;
                homeRuns = gm.liveData.linescore.teams.home.runs;
            } else {
                awayRuns = 0;
                homeRuns = 0;
            }
            
            // Emojis
            const discordSecret = await getDiscordSecrets();
            const endpointInfo = {
                authToken: discordSecret?.token,
                applicationId: undefined,
                guildId: discordSecret?.guild_id
              };
            const getTeamEmojis = await getGuildEmojis(endpointInfo);
            const teamEmojis = getTeamEmojis.data;

            let awayEmoji: string = '';
            let homeEmoji: string = '';
            for ( const tm of teamEmojis ) {
                if ( `mlb_${awayName}` == tm.name ) {
                    awayEmoji = `<:${tm.name}:${tm.id}>`
                };
                if ( `mlb_${homeName}` == tm.name ) {
                    homeEmoji = `<:${tm.name}:${tm.id}>`
                };
            };

            console.log(awayEmoji);
            console.log(homeEmoji);
            
            const awayLine: string = `${awayEmoji} ${awayAbbr} ${awayRuns} (${awayWin}-${awayLoss})`;
            const homeLine: string = `${homeEmoji} ${homeAbbr} ${homeRuns} (${homeWin}-${homeLoss})`;

            let statusEmoji: string;

            if (abstract === 'Preview' || status.startsWith('Warmup')) {
                statusEmoji = emoji.emojify(':date:');
            } else if (status.startsWith('In Progress')) {
                statusEmoji = emoji.emojify(':red_circle:');
            } else if (status.startsWith('Delayed') || status.startsWith('Suspended')) {
                statusEmoji = emoji.emojify(':pause_button:');
            } else if (abstract === 'Final') {
                statusEmoji = emoji.emojify(':checkered_flag:');
            } else {
                statusEmoji = emoji.emojify(':x:');
            }

            // Formatting
            let score: string;
            score = `${statusEmoji} ${status} • ${awayLine} @ ${homeLine}`;

            // Time conversion for scheduled games
            const schedString: string = gm.gameData.datetime.dateTime;
            const schedDT = new Date(schedString);
            const schedLocal: string = schedDT.toLocaleString('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
                timeZoneName: 'short'
            });

            const timeEmoji: string = emoji.emojify(":clock3:");

            let inning: number;
            let fpLocal: string;

            if ('currentInning' in gm.liveData.linescore) {
                inning = gm.liveData.linescore.currentInning;
                
                // Time conversion for live and completed games
                const fpString: string = gm.gameData.gameInfo.firstPitch;
                const fpDT = new Date(fpString);
                fpLocal = fpDT.toLocaleString('en-US', {
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true,
                    timeZoneName: 'short'
                });
            } else {
                return `${score} • ${timeEmoji} ${schedLocal}`;
            }

            // More formatting; current inning, extra innings, etc.
            if (abstract === 'Live') {
                const half: string = gm.liveData.linescore.inningHalf;
                score = `${statusEmoji} ${status} - ${half} ${inning} • ${awayLine} @ ${homeLine}`;
            } else if (inning > 9 && abstract === 'Final') {
                score = `${statusEmoji} ${status} (${inning}) • ${awayLine} @ ${homeLine}`;
            }

            let intLength: number;

            if (status.startsWith('Suspended')) {
                return `${score} • ${timeEmoji} ${fpLocal}`;
            } else if (status.startsWith('Final') || status.startsWith('Game Over')) {
                intLength = gm.gameData.gameInfo.gameDurationMinutes;
            } else {
                return `${score} • ${timeEmoji} ${fpLocal}`;
            }

            // Length of game in hours and minutes
            const hours: number = Math.floor(intLength / 60);
            const minutes: string = (intLength % 60).toString().padStart(2, '0');
            const length = `${hours}:${minutes}`;

            // Last formatting
            const gameTimeComplete: string = `${timeEmoji} ${fpLocal} - Length: ${length}`;
            const finalDetailed: string = `${score} • ${gameTimeComplete}`
            return finalDetailed;

        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }
}