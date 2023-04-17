'use strict';

import {Logger} from "./modules/logger/logger.js";
import {CurrencyConverter} from "./modules/currency-converter/currency-converter.js";
import {CbrSourcePlugin} from "./modules/currency-converter/plugins/cbr-source-plugin.js";
import {FixerPlugin} from "./modules/currency-converter/plugins/fixer-plugin.js";
import {BanksKgBaitushum} from "./modules/currency-converter/plugins/banks-kg-baitushum.js";

let log = new Logger();

log.log('Started');

let sourcePlugin = new BanksKgBaitushum();
let converter = new CurrencyConverter(sourcePlugin);

let tests = [
    [7000, 'RUB', 'USD'],
    [7000, 'USD', 'RUB'],
    [7000, 'USD', 'USD'],
    [7000, 'USD', 'KGS'],
    [7000, 'KGS', 'USD'],
    [7000, 'KGS', 'RUB'],
    [7000, 'RUB', 'KGS'],
    [1.21, 'USD', 'RUB'],
    [5, 'USD', 'RUB'],
    [104.68, 'KGS', 'RUB'],
    [100, 'USD', 'RUB'],
    [100, 'USD', 'KGS'],
];

tests.forEach((_t) => {
    converter.convert(..._t).then((result) => {
        log.log(_t[0] + ' ' + _t[1] + ' = ' + result + ' ' + _t[2]);
    });
})
