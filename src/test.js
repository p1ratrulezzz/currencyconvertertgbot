'use strict';

import {Logger} from "./modules/logger/logger.js";
import {CurrencyConverter} from "./modules/currency-converter/currency-converter.js";
import {CbrSourcePlugin} from "./modules/currency-converter/plugins/CbrSourcePlugin.js";

let log = new Logger();

log.log('Started');

let converter = new CurrencyConverter();
let cbrSource = new CbrSourcePlugin();

converter.setSourcePlugin(cbrSource);

let tests = [
    [7000, 'RUB', 'USD'],
    [7000, 'USD', 'USD'],
    [7000, 'USD', 'RUB'],
    [7000, 'USD', 'KZT'],
    [7000, 'KZT', 'EUR'],
    [7000, 'KZT', 'RUB'],
    [7000, 'USD', 'EUR'],
    [7000, 'EUR', 'USD'],
];

tests.forEach((_t) => {
    converter.convert(..._t).then((result) => {
        log.log(_t[0] + ' ' + _t[1] + ' = ' + result + ' ' + _t[2]);
    });
})
