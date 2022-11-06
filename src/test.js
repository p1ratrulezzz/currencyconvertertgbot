'use strict';

import {Logger} from "./modules/logger/logger.js";
import {CurrencyConverter} from "./modules/currency-converter/currency-converter.js";
import {CbrSourcePlugin} from "./modules/currency-converter/plugins/CbrSourcePlugin.js";

let log = new Logger();

log.log('Started');

let converter = new CurrencyConverter();
let cbrSource = new CbrSourcePlugin();

converter.setSourcePlugin(cbrSource);
let usd = await converter.convert(7000, 'KZT', 'RUB');
let usd2 = await converter.convert(7000, 'USD', 'RUB');
let usd3 = await converter.convert(8, 'USD', 'KZT');

log.log('500 rub is ' + String(usd) + ' usd');
log.log('500 rub is ' + String(usd2) + ' usd');
log.log('500 rub is ' + String(usd3) + ' usd');
