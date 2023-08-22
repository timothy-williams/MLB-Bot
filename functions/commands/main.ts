import axios from 'axios';
import * as emoji from 'node-emoji';
import { getGuildEmojis } from '../utils/EndpointInteractions';
import { getDiscordSecrets } from '../utils/DiscordSecrets';
import { teamAbbr } from '../constants/TeamAbbr';

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
            
            // Emojis
            const discordSecret = await getDiscordSecrets();
            const endpointInfo = {
                authToken: discordSecret?.token,
                applicationId: undefined,
                guildId: discordSecret?.guild_id
              };
            const getTeamEmojis = await getGuildEmojis(endpointInfo);
            console.log(getTeamEmojis);

            const teamEmojis: Record<string, string> = {
                'LAA': '<:mlb_angels:1138888639682728107>',
                'HOU': '<:mlb_astros:1138888640991334491>',
                'OAK': '<:mlb_athletics:1138888642346094632>',
                'TOR': '<:mlb_bluejays:1138888643143012476>',
                'ATL': '<:mlb_braves:1138888644288073828>',
                'MIL': '<:mlb_brewers:1138888926849933314>',
                'STL': '<:mlb_cardinals:1138888941135745145>',
                'CHC': '<:mlb_cubs:1138888956868579388>',
                'AZ': '<:mlb_diamondbacks:1138888969761869865>',
                'LAD': '<:mlb_dodgers:1138888984479666286>',
                'SF': '<:mlb_giants:1138889008198451240>',
                'CLE': '<:mlb_guardians:1138889033745969273>',
                'SEA': '<:mlb_mariners:1138889047582965801>',
                'MIA': '<:mlb_marlins:1138889060778258583>',
                'NYM': '<:mlb_mets:1138889073830928505>',
                'WSH': '<:mlb_nationals:1138889087294652446>',
                'BAL': '<:mlb_orioles:1138889138398040064>',
                'SD': '<:mlb_padres:1138889153946333214>',
                'PHI': '<:mlb_phillies:1138889169154875402>',
                'PIT': '<:mlb_pirates:1138889185802064043>',
                'TEX': '<:mlb_rangers:1138889199169306726>',
                'TB': '<:mlb_rays:1138889211534119093>',
                'CIN': '<:mlb_reds:1138889225052368907>',
                'BOS': '<:mlb_redsox:1138889237777883136>',
                'COL': '<:mlb_rockies:1138889251182891048>',
                'KC': '<:mlb_royals:1138889264474632223>',
                'DET': '<:mlb_tigers:1138889277095280707>',
                'MIN': '<:mlb_twins:1138889294090604726>',
                'CWS': '<:mlb_whitesox:1138889308854550640>',
                'NYY': '<:mlb_yankees:1138889323408797787>'
            };
            
            const awayEmoji: string = teamEmojis[awayAbbr];
            const homeEmoji: string = teamEmojis[homeAbbr];
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