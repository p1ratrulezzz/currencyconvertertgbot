let BOTS = [];
const FIXER_API_KEY = 'token';
const SERVER_PORT = 20000;
const SERVER_IP = '0.0.0.0';

export {
    BOTS,
    FIXER_API_KEY,
    SERVER_PORT,
    SERVER_IP
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
