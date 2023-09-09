import { Standings } from '../../lib/classes/StandingsClass';
import { divisionIDs, leagueIDs } from '../constants/MLBProps';

export async function formatDivisionStandings(leagueId: string, divisionId: string) {
    /*
    NL East |    W    L     %    GB   WCGB   E#
    --------|----------------------------------
    Team 1  |  100   62  .000     -  +10.0    -
    Team 2  |   62  100  .000   1.0   +7.0  121
    Team 3  |   62   62  .000  12.5      -   14
    Team 4  |   62    6  .000  25.0    1.0    9
    Team 5  |    6    2  .000  50.0   12.0    E
    */

    const standsClass = new Standings(leagueId);
    const divStands = await standsClass.getDivisionStandings(divisionId);

    // Build header
    var divisionName = divisionIDs[divisionId].name || 'Unknown Division';
    const winLossHeader = '   W   L     %    GB   WCGB   E#';

    // Extract 'name' values into a separate list
    const nameValues = Object.values(divStands!.teams) as { teamName: string }[];
    const teamNames: string[] = Object.values(nameValues).map(item => item.teamName);

    // Check if longest team name is longer than division name
    // so left padding is correct across rows
    const lengthOfLongestName = Math.max(...(teamNames.map(name => name.length)));
    if (lengthOfLongestName > divisionName.length) {
        divisionName = divisionName.padEnd(lengthOfLongestName + 1);
    }

    // Header padding
    const leftPad = ''.padStart(divisionName.length, '-');
    const rightPad = '--------------------------------';
    const headerPad = `${leftPad}|${rightPad}`;

    const teamLines = [];
    for (const tm of Object.values(divStands!.teams) as Record<string, any>[]) {
        const name = tm.teamName.padEnd(divisionName.length);
        const wins = tm.teamWins.toString().padStart(4);
        const losses = tm.teamLosses.toString().padStart(4);
        const pct = tm.WLPercent.padStart(6);
        const GB = tm.gamesBack.padStart(6);
        const WCGB = tm.wildCardGB.padStart(7);
        const elim = tm.elimNum.padStart(5);

        const teamLine = `${name}|${wins}${losses}${pct}${GB}${WCGB}${elim}`;
        teamLines.push(teamLine);
    }

    // Build full standings
    const header = `${divisionName}|${winLossHeader}`;
    const standingsArray = [
        header, headerPad, ...teamLines
    ];
    const standingsMessage = standingsArray.join('\n');

    return standingsMessage;
}

export async function formatWildCardStandings(leagueId: string) {
    /*
    NL Wild Card |   W   L     %   WCGB  WCE
    -------------|--------------------------
    Team 1       | 100  62  .000  +10.0    -
    Team 2       |  62 100  .000   +7.0  121
    Team 3       |  62  62  .000      -   14
    -  -  -  -  -  -  -  -  -  -  -  -  -  -
    Team 4       |  62   6  .000    1.0    9
    Team 5       |   6   2  .000   12.0    E
    ...
    */

    const standsClass = new Standings(leagueId);
    const WCStands = await standsClass.getWildCardStandings();

    // Build header
    const wildCardHeader = `${leagueIDs[leagueId].abbr} Wild Card ` || 'Unknown League ';
    const winLossHeader = '   W   L     %   WCGB  WCE';
    const header = `${wildCardHeader}|${winLossHeader}`;
    const headerPad = '-------------|--------------------------';

    // Build team lines
    const wildCardLeaders = [];
    const notWildCardLeaders = [];
    const standingsPad = '-  -  -  -  -  -  -  -  -  -  -  -  -  -';

    for (const tm of Object.values(WCStands.teams) as Record<string, any>[]) {
        const name = tm.teamName.padEnd(wildCardHeader.length);
        const wins = tm.teamWins.toString().padStart(4);
        const losses = tm.teamLosses.toString().padStart(4);
        const pct = tm.WLPercent.padStart(6);
        const WCGB = tm.wildCardGB.padStart(7);
        const WCE = tm.wildCardElimNum.padStart(5);

        const teamLine = `${name}|${wins}${losses}${pct}${WCGB}${WCE}`;

        if (tm.wildCardLeader) {
            wildCardLeaders.push(teamLine);
        } else {
            notWildCardLeaders.push(teamLine);
        }
    }

    // Build full standings
    const standingsArray = [
        header, headerPad, ...wildCardLeaders, standingsPad, ...notWildCardLeaders
    ];
    const standingsMessage = standingsArray.join('\n');

    return standingsMessage;
}