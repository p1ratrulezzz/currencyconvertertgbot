import axios from "axios";
import {SourcePluginAbstract} from "../source-plugin-abstract.js";
import {XMLParser} from "fast-xml-parser";
import {Currency} from "../currency.js";

class CbrSourcePlugin extends SourcePluginAbstract {
    /**
     * @type {Currency}
     * @private
     */
    _currencyNative;

    /**
     *
     * @return {Promise<{Array}>}
     * @private
     */
    loadCurrencies() {
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
}

export {
    CbrSourcePlugin
}