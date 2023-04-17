import {FixerPlugin} from "./src/modules/currency-converter/plugins/fixer-plugin.js";

export let BOTS = [];
export const SEED = '20230102';
export const SERVER_PORT = 20000;
export const SERVER_IP = '0.0.0.0';

const FIXER_API_KEY = 'token';
export const PLUGIN_DEFAULT = new FixerPlugin(FIXER_API_KEY);


BOTS.push({
    plugin: new FixerPlugin(FIXER_API_KEY, 'GBP', 'RUB')
});

BOTS.push({
    plugin: new FixerPlugin(FIXER_API_KEY, 'UAH', 'USD')
});
