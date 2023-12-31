export const mlbIDs: { [key: string]: string } = {
    'LAA': '108',
    'ARI': '109',
    'ATL': '144',
    'BAL': '110',
    'BOS': '111',
    'CHC': '112',
    'CWS': '145',
    'CIN': '113',
    'CLE': '114',
    'COL': '115',
    'DET': '116',
    'HOU': '117',
    'KC': '118',
    'LAD': '119',
    'MIA': '146',
    'MIL': '158',
    'MIN': '142',
    'NYM': '121',
    'NYY': '147',
    'OAK': '133',
    'PHI': '143',
    'PIT': '134',
    'SD': '135',
    'SEA': '136',
    'SF': '137',
    'STL': '138',
    'TB': '139',
    'TEX': '140',
    'TOR': '141',
    'WSH': '120'
};

export const divisionIDs: { [key: string]: Record<any, string> } = {
    '200': {abbr: 'ALW', name: 'AL West', league: '103'}, 
    '201': {abbr: 'ALE', name: 'AL East', league: '103'},
    '202': {abbr: 'ALC', name: 'AL Central', league: '103'},
    '203': {abbr: 'NLW', name: 'NL West', league: '104'}, 
    '204': {abbr: 'NLE', name: 'NL East', league: '104'}, 
    '205': {abbr: 'NLC', name: 'NL Central', league: '104'}, 
};

export const leagueIDs: { [key: string]: Record<any, string> } = {
    '103': {abbr: 'AL', name: 'Americal League'},
    '104': {abbr: 'NL', name: 'National League'},
};