import {SourcePluginAbstract} from "../source-plugin-abstract.js";
import axios from "axios";
import {Currency} from "../currency.js";

class FixerPlugin extends SourcePluginAbstract {
    ENDPOINT = 'https://api.apilayer.com'

    API_KEY = null;

    constructor(apikey, nativeCurrency) {
        super();

        this.API_KEY = apikey;

        this._currencyNative.Code = nativeCurrency;
        this._currencyNative.CodeTo = nativeCurrency;

        if (this.API_KEY == null) {
            throw new Error("no FIXER_APIKEY");
        }
    }

    cacheKey(options) {
        return super.cacheKey(options) + ':' + this._currencyNative.Code;
    }

    /**
     * {@inheritDoc}
     */
    loadCurrencies() {
        return axios.get(this.ENDPOINT + '/fixer/latest',{
            params: {
                'base': this._currencyNative.Code,
            },
            headers: {
                'apikey': this.API_KEY
            },
        }).then((response) => {
            if (response.data != null && response.data.success === true) {
                let currencies = {};

                for (let _code in response.data.rates) {
                    let currency = new Currency();
                    currency.CodeTo = _code;
                    currency.Name = _code;
                    currency.Code = this._currencyNative.Code;
                    currency.Nominal = 1;
                    currency.Value = 1 / response.data.rates[_code];

                    currencies[_code] = currency;
                }

                return currencies;
            }

            throw new Error('can\'t load currencies');
        }).catch((err) => {
            throw new Error('Can\'t load')
        });
    }
}

export {
    FixerPlugin
}