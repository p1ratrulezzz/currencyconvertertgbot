let BOTS = [];
const FIXER_API_KEY = 'token';

export {
    BOTS,
    FIXER_API_KEY
}

BOTS.push({
    token: '123456:tokenbot1',
    source: 'GBP',
    to: 'RUB'
});

BOTS.push({
    token: '123456:tokenbot2',
    source: 'UAH',
    to: 'USD'
});
