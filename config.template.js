export let BOTS = [];
export const FIXER_API_KEY = 'token';
export const SEED = '20230102';
export const SERVER_PORT = 20000;
export const SERVER_IP = '0.0.0.0';

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
