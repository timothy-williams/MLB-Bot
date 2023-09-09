import { Game } from '../../lib/classes/GameClass';

export async function formatLinescore(gameId: string) {
    /*
    MM/DD/YY |  1  2  3  4  5  6  7  8  9  |  R  H  E
    ---------|-----------------------------|-----------
    Team 1   |  0  0  0  0  0  0  0  0  0  |  0  0  0 
    Team 2   |  0  0  0  0  0  0  0  0  X  |  0  0  0
    */

    const gameClass = new Game(gameId);
    const gmTeams = await gameClass.getAwayHomeInfo();
    const gmDT = await gameClass.getDateTime();
    const gmInn = await gameClass.getByInning();
    const gmState = await gameClass.getGameState();

    const gameDate = new Date(gmDT['dateTime']);
    const dateSimple: string = gameDate.toLocaleDateString('en-US', {
        timeZone: 'America/Los_Angeles' 
    }); // MM/DD/YYYY
    const awayName: string = gmTeams['awayName'];
    const homeName: string = gmTeams['homeName'];

    /* Split linescore into 9 sections like a 3x3 grid */

    // Define left third
    var topLeft: string; // Date
    var leftPad: string; // Dash padding below date
    var midLeft: string; // Away team name
    var botLeft: string; // Home team name

    if ((dateSimple.length >= awayName.length) || // If date is longer
        (dateSimple.length >= homeName.length)) {
        topLeft = dateSimple + ' ';
        leftPad = ''.padStart(topLeft.length, '-');
        midLeft = awayName.padEnd(topLeft.length);
        botLeft = homeName.padEnd(topLeft.length);
    } else { // If one of the team names are longer
        if (awayName.length >= homeName.length) {
            midLeft = awayName + ' ';
            topLeft = dateSimple.padEnd(midLeft.length);
            leftPad = ''.padStart(midLeft.length, '-');
            botLeft = homeName.padEnd(midLeft.length);
        } else {
            botLeft = homeName + ' ';
            topLeft = dateSimple.padEnd(botLeft.length);
            leftPad = ''.padStart(botLeft.length, '-');
            midLeft = awayName.padEnd(botLeft.length);
        }
    }

    // Define middle third
    let topMid = ''; // Innings
    var midPad: string; // Dash padding below innings
    let midMid = ''; // Away team runs scored by inning
    let botMid = ''; // Home team runs scored by inning

    for (let i = 1; i <= gmState['inning']; i++) {
        topMid += i.toString().padEnd(3); // 3 spaces between each number
    }

    topMid = `  ${topMid}`;
    midPad = ''.padStart(topMid.length, '-');

    for (const i of Object.values(gmInn['awayRunsByInn']) as any[]) {
        midMid += i.toString().padEnd(3);
    }
    for (const i of Object.values(gmInn['homeRunsByInn']) as any[]) {
        botMid += i.toString().padEnd(3);
    }

    midMid = `  ${midMid.trimEnd()}  `;
    botMid = `  ${botMid.trimEnd()}  `;

    // Define right third
    const topRight = '  R  H  E  ';
    const rightPad = ''.padStart(topRight.length, '-');

    const awayRuns = gmTeams['awayRuns'].toString();
    const awayHits = gmTeams['awayHits'].toString();
    const awayErrors = gmTeams['awayErrors'].toString();
    const homeRuns = gmTeams['homeRuns'].toString();
    const homeHits = gmTeams['homeHits'].toString();
    const homeErrors = gmTeams['homeErrors'].toString();

    const midRight = `  ${awayRuns.padEnd(3)}${awayHits.padEnd(3)}${awayErrors}`;
    const botRight = `  ${homeRuns.padEnd(3)}${homeHits.padEnd(3)}${homeErrors}`;

    // Build the linescore
    const topLine = `${topLeft}|${topMid}|${topRight}`;
    const padLine = `${leftPad}|${midPad}|${rightPad}`;
    const midLine = `${midLeft}|${midMid}|${midRight}`;
    const botLine = `${botLeft}|${botMid}|${botRight}`;

    return `${topLine}\n${padLine}\n${midLine}\n${botLine}`;
}
