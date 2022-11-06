import axios from "axios";
import {SourcePluginAbstract} from "../source-plugin-abstract.js";
import {XMLParser} from "fast-xml-parser";
import {Currency} from "../currency.js";
import {caching, multiCaching} from "cache-manager";
import {create as DiskStore} from "cache-manager-fs-hash";
import * as os from "os";

class CbrSourcePlugin extends SourcePluginAbstract {

    /**
     *
     * @type {Object}
     * @private
     */
    _currencies = null;

    /**
     *
     * @private
     */
    _locked;

    /**
     * @type {Currency}
     * @private
     */
    _currencyNative;

    /**
     * @type {caching}
     * @private
     */
    _cacheManager;

    constructor() {
        super();

        let fsStore = new DiskStore({
            path: os.tmpdir() + '/cbr_source_plugin_cache',
            ttl: 10 * 60 * 60,
        });

        this._cacheManager = caching(fsStore);
        this._locked = true;
        this._currencies = {};
        this._currencyNative = new Currency();
        this._currencyNative.Name = 'RUB';
        this._currencyNative.Code = 'RUB';
        this._currencyNative.CodeTo = 'RUB';
        this._currencyNative.Nominal = 1;
        this._currencyNative.Value = 1;

        this._currencies[this._currencyNative.CodeTo] = this._currencyNative;

        this._getCurrencies();
    }

    _getCurrencies() {
        let me = this;

        return me._cacheManager.then((cache) => {
            return cache
                .get('currencies')
                .then((data) => {
                    if (data != null) {
                        return data;
                    }

                    return me._loadCurrencies().then((currencies) => {
                        return cache.set('currencies', currencies).then(() => {
                            return currencies;
                        });
                    });
                });
        });
    }

    _loadCurrencies() {
        let me = this;

        let currencies = {};
        currencies[me._currencyNative.CodeTo] = me._currencyNative;

        return axios
            .get('https://www.cbr.ru/scripts/XML_daily.asp')
            .then((response) => {
                let xmlparser = new XMLParser();
                let parsed = xmlparser.parse(response.data);

                parsed.ValCurs.Valute.forEach((currency) => {
                    let newcurr = new Currency();
                    newcurr.Code = me._currencyNative.CodeTo;
                    newcurr.CodeTo = String(currency.CharCode).toUpperCase();
                    newcurr.Name = currency.Name;
                    newcurr.Value = parseFloat(String(currency.Value).replace(/,/i, '.'));
                    newcurr.Nominal = parseFloat(currency.Nominal);

                    currencies[newcurr.CodeTo] = newcurr;
                });

                return currencies;
            });
    }

    checkLock() {
        let me = this;
        return new Promise((resolve) => {
            if (this._locked === false) {
                return resolve();
            }

            let interValId;
            let waitFunc = function () {
                if (me._locked === false) {
                    clearInterval(interValId);
                    resolve();
                }
            }

            interValId = setInterval(waitFunc, 1);
        });
    }

    findCurrency(codeFrom, codeTo) {
        let me = this;
        return this._getCurrencies().then((currencies) => {
            let codeSource = codeFrom;
            let invert = false;
            if (codeFrom === me._currencyNative.CodeTo) {
                codeSource = codeTo;
                invert = true;
            }

            let currency = currencies[codeSource] || null;
            if (currency === null) {
                throw new Error('currency ' + String(codeTo) + ' is not supported');
            }

            if (invert) {
                currency.Value = 1 / (currency.Value / currency.Nominal);
            }

            return currency;
        });
    }

}

export {
    CbrSourcePlugin
}