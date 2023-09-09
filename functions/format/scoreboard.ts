import { Game } from '../../lib/classes/GameClass';
import { getGuildEmojis } from '../utils/EndpointInteractions';
import { getDiscordSecrets } from '../utils/DiscordSecrets';
import * as emoji from 'node-emoji';

export async function formatScoreboard(gameId: string) {
    const gameClass = new Game(gameId);
    const gmState = await gameClass.getGameState();
    const gmTeams = await gameClass.getAwayHomeInfo();
    const gmDT = await gameClass.getDateTime();

    const awayName = gmTeams['awayName'].toLowerCase().replace(/\s+/g, '');
    const homeName = gmTeams['homeName'].toLowerCase().replace(/\s+/g, '');

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

    const awayAbbr = gmTeams['awayAbbr'];
    const awayRuns = gmTeams['awayRuns'];
    const awayWin = gmTeams['awayWin'];
    const awayLoss = gmTeams['awayLoss'];
    const homeAbbr = gmTeams['homeAbbr'];
    const homeRuns = gmTeams['homeRuns'];
    const homeWin = gmTeams['homeWin'];
    const homeLoss = gmTeams['homeLoss'];

    const awayLine = `${awayEmoji} ${awayAbbr} ${awayRuns} (${awayWin}-${awayLoss})`;
    const homeLine = `${homeEmoji} ${homeAbbr} ${homeRuns} (${homeWin}-${homeLoss})`;

    const condenseStatus = gmState['condenseStatus'];
    var statusEmoji = '';

    switch (condenseStatus) {
        case 'Scheduled':
            statusEmoji = emoji.emojify(':date:');
            break;
        case 'Live':
            statusEmoji = emoji.emojify(':red_circle:');
            break;
        case 'Delayed':
            statusEmoji = emoji.emojify(':pause_button:');
            break;
        case 'Suspended':
            statusEmoji = emoji.emojify(':cloud_rain:');
            break;
        case 'Final':
            statusEmoji = emoji.emojify(':checkered_flag:');
            break;
        case '???':
            statusEmoji = emoji.emojify(':x:');
            break;
    };

    var score = `${statusEmoji} ${condenseStatus} ${awayLine} @ ${homeLine}`;

    const DT = new Date(gmDT['startTime']);
    const toPST = DT.toLocaleString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        timeZone: 'America/Los_Angeles'
    });

    const timeEmoji: string = emoji.emojify(":clock3:");
    const abstract = gmState['abstractState'];
    const inning = gmState['inning'];
    const half = gmState['half'];
    const intLength = gmState['gameLength'];

    if (gmState['TBD'] && (abstract === 'Preview')) { 
        return `${score} ${timeEmoji} TBD`;
    } 
    
    if (inning > 9 && condenseStatus === 'Final') {
        score = `${statusEmoji} ${condenseStatus} (${inning}) ${awayLine} @ ${homeLine}`;
    }

    switch (condenseStatus) {
        case 'Live':
            score = `${statusEmoji} ${condenseStatus} • ${half} ${inning} ${awayLine} @ ${homeLine}`;
            return `${score} ${timeEmoji} ${toPST}`;
        case 'Scheduled':
        case 'Delayed':
        case 'Suspended':
        case '???':
            return `${score} ${timeEmoji} ${toPST}`;
        case 'Final':
            const hours: number = Math.floor(intLength / 60);
            const minutes: string = (intLength % 60).toString().padStart(2, '0');
            const length = `${hours}:${minutes}`;

            const gameTimeComplete: string = `${timeEmoji} ${toPST} • Length: ${length}`;
            const finalDetailed: string = `${score} ${gameTimeComplete}`
            return finalDetailed;
    };

    return 'Something went wrong.';
}
