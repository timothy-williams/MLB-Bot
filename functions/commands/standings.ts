import { EmbedStructure } from '../../lib/types/discord';
import {
    formatDivisionStandings,
    formatWildCardStandings
} from '../format/standings';
import { divisionIDs, leagueIDs } from '../constants/MLBProps';

export class DivisionStandings implements EmbedStructure {
    async content(divisionId: string) {
        const leagueId: string = divisionIDs[divisionId].league;
        const standings = await formatDivisionStandings(leagueId, divisionId);
        return "```" + standings + "```";
    }

    title(divisionId: string) {
        const divName = divisionIDs[divisionId].name
        return `${divName} Standings`;
    }

    url() {
        return 'https://www.mlb.com/standings';
    }

    color() {
        return 65517;
    }

    async buildObject(divisionId: string) {
        return {
            description: await this.content(divisionId),
            title: this.title(divisionId),
            url: this.url(),
            color: this.color()
        };
    }
}

export class WildCardStandings implements EmbedStructure {
    async content(leagueId: string) {
        return (await formatWildCardStandings(leagueId));
    }

    title(leagueId: string) {
        const WCName = leagueIDs[leagueId].abbr;
        return `${WCName} Wild Card Standings`;
    }

    url() {
        return 'https://www.mlb.com/standings/wild-card';
    }

    color() {
        return 65517;
    }

    async buildObject(leagueId: string) {
        return {
            description: await this.content(leagueId),
            title: this.title(leagueId),
            url: this.url(),
            color: this.color()
        };
    }
}