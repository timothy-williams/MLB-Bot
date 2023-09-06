import { Game } from '../../lib/classes/GameClass';
import { getGuildEmojis } from '../utils/EndpointInteractions';
import { getDiscordSecrets } from '../utils/DiscordSecrets';
import * as emoji from 'node-emoji';

export async function formatScoreboard(gameId: string) {
    const gameClass = new Game(gameId);
    const gmState = await gameClass.getGameState();
    const gmTeams = await gameClass.getAwayHomeInfo();
    const gmDT = await gameClass.getDateTime();

    const awayName = gmTeams.get('awayName').toLowerCase().replace(/\s+/g, '');
    const homeName = gmTeams.get('homeName').toLowerCase().replace(/\s+/g, '');

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

    const awayAbbr = gmTeams.get('awayAbbr');
    const awayRuns = gmTeams.get('awayRuns');
    const awayWin = gmTeams.get('awayWin');
    const awayLoss = gmTeams.get('awayLoss');
    const homeAbbr = gmTeams.get('homeAbbr');
    const homeRuns = gmTeams.get('homeRuns');
    const homeWin = gmTeams.get('homeWin');
    const homeLoss = gmTeams.get('homeLoss');

    const awayLine = `${awayEmoji} ${awayAbbr} ${awayRuns} (${awayWin}-${awayLoss})`;
    const homeLine = `${homeEmoji} ${homeAbbr} ${homeRuns} (${homeWin}-${homeLoss})`;

    const condenseStatus = gmState.get('condenseStatus');
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

    const DT = new Date(gmDT.get('startTime'));
    const toPST = DT.toLocaleString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        timeZone: 'America/Los_Angeles'
    });
    const timeEmoji: string = emoji.emojify(":clock3:");

    const abstract = gmState.get('abstractState');
    const inning = gmState.get('inning');
    const half = gmState.get('half');
    const intLength = gmState.get('gameLength');

    if (gmState.get('TBD') && (abstract === 'Preview')) { 
        return `${score} ${timeEmoji} TBD`;
    } else if (!inning || (condenseStatus === 'Suspended')) {
        return `${score} ${timeEmoji} ${toPST}`;
    }

    if (abstract === 'Live') {
        score = `${statusEmoji} ${condenseStatus} • ${half} ${inning} ${awayLine} @ ${homeLine}`;
        return `${score} ${timeEmoji} ${toPST}`;
    } else if (inning > 9 && abstract === 'Final') {
        score = `${statusEmoji} ${condenseStatus} (${inning}) ${awayLine} @ ${homeLine}`;
    }

    if (intLength) {
        const hours: number = Math.floor(intLength / 60);
        const minutes: string = (intLength % 60).toString().padStart(2, '0');
        const length = `${hours}:${minutes}`;

        const gameTimeComplete: string = `${timeEmoji} ${toPST} • Length: ${length}`;
        const finalDetailed: string = `${score} ${gameTimeComplete}`
        return finalDetailed;
    }

    return 'Something went wrong.';
}