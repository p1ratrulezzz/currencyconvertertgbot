import {Currency} from "./currency.js";
import {SourcePluginInterface} from "./source-plugin-interface.js"
import {caching} from "cache-manager";
import {create as DiskStore} from "cache-manager-fs-hash";
import os from "os";
import {createHash} from "node:crypto";

/**
 * @abstract
 */
class SourcePluginAbstract extends SourcePluginInterface {

    /**
     * @type {caching}
     * @private
     */
    _cacheManager;

    /**
     * {@inheritDoc}
     */
    loadCurrencies() {
        throw new Error('implement loadCurrencies() method')
    }

    constructor() {
        super();

        let hash = createHash('sha256');
        hash.update(this.constructor.name);

        let ttl_date = new Date();
        ttl_date.setHours(23, 59, 59, 999);

        let fsStore = new DiskStore({
            path: os.tmpdir() + '/' + hash.digest('hex'),
            ttl: Math.floor(Number(ttl_date) / 1000)
        });

        this._cacheManager = caching(fsStore);

        this._currencyNative = new Currency();
        this._currencyNative.Name = 'RUB';
        this._currencyNative.Code = 'RUB';
        this._currencyNative.CodeTo = 'RUB';
        this._currencyNative.Nominal = 1;
        this._currencyNative.Value = 1;

        this.getCurrencies();
    }

    cacheKey(options) {
        return 'currencies';
    }

    /**
     * {@inheritDoc}
     */
    getCurrencies() {
        let me = this;

        return me._cacheManager.then((cache) => {
            return cache
                .get(this.cacheKey())
                .then((data) => {
                    if (data != null) {
                        return data;
                    }

                    return me.loadCurrencies().then((currencies) => {
                        return cache.set(this.cacheKey(), currencies).then(() => {
                            return currencies;
                        });
                    });
                });
        });
    }

    /**
     *
     * @param codeSource
     * @param codeTo
     * @returns {Promise<unknown>|any}
     */
    fromToCurrency(codeSource, codeTo) {
        let me = this;
        if (codeSource === codeTo) {
            return new Promise((resolve) => resolve(me._currencyNative));
        }

        return this.getCurrencies().then((currencies) => {
            let currency = currencies[codeSource + '_' + codeTo] || null;

            if (currency) {
                return currency;
            }

            let sourceCurrencyQuote = currencies[codeSource] || null;
            let toCurrencyQuote = currencies[codeTo] || null;

            if (sourceCurrencyQuote == null || toCurrencyQuote == null) {
                throw new Error('currency ' + String(codeSource) + ' or ' + String(codeTo) + ' is not supported');
            }

            currency = new Currency();
            currency.Code = codeSource;
            currency.CodeTo = codeTo;
            currency.Name = codeSource + ' to ' + codeTo;
            currency.Nominal = 1;
            currency.Value =
                (sourceCurrencyQuote.Value / sourceCurrencyQuote.Nominal)
                /
                (toCurrencyQuote.Value / toCurrencyQuote.Nominal);

            return currency;
        });
    }
}

export {
    SourcePluginAbstract
}