import axios from "axios";
import {Currency} from "../currency.js";
import {SourcePluginAbstract} from "../source-plugin-abstract.js";

class BanksKgBaitushum extends SourcePluginAbstract {
    // https://banks.kg/api/v1/rates/history/rub?organization_id=10&cash_type=cashless
    ENDPOINT = 'https://banks.kg/api/v1'
    ORGID_BAITUSHUM = 10;

    constructor() {
        super();

        // 30 minutes
        this.setCacheTtl(30 * 60);

        this._currencyNative.Code = 'RUB';
        this._currencyNative.CodeTo = 'USD';
    }

    cacheKey(options) {
        return super.cacheKey(options) + ':' + this._currencyNative.Code;
    }

    /**
     * {@inheritDoc}
     */
    loadCurrencies() {
        return axios.get(this.ENDPOINT + '/rates/history/rub',{
            params: {
                'organization_id': this.ORGID_BAITUSHUM,
                'cash_type': 'cashless'
            },
        }).then((response) => {
            let responses = {};

            if (response.data == null) {
                throw new Error('no response for RUB');
            }

            // kgs to rub
            responses['rub'] = response.data;

            return axios.get(this.ENDPOINT + '/rates/history/usd',{
                params: {
                    'organization_id': this.ORGID_BAITUSHUM,
                    'cash_type': 'cashless'
                },
            }).then((response) => {
                if (response.data == null) {
                    throw new Error('no response for USD');
                }

                responses['usd'] = response.data;

                return responses;
            });
        }).then((responses) => {
            let a = 1;

            let currencies = {};

            // I buy KGS for this amount of RUB
            let currency = new Currency();
            currency.Code = 'RUB';
            currency.CodeTo = 'KGS';
            currency.Name = currency.Code + ' to ' + currency.CodeTo;
            currency.Value = responses['rub']['sell'].pop()[1];
            currency.Nominal = 1;

            currencies['RUB_KGS'] = currency;

            // I buy RUB for this amount of KGS
            currency = new Currency();
            currency.Code = 'KGS';
            currency.CodeTo = 'RUB';
            currency.Name = currency.Code + ' to ' + currency.CodeTo;
            currency.Value = 1 / responses['rub']['buy'].pop()[1];
            currency.Nominal = 1;

            currencies['KGS_RUB'] = currency;

            // I buy KGS for this amount of USD
            currency = new Currency();
            currency.Code = 'KGS';
            currency.CodeTo = 'USD';
            currency.Name = currency.Code + ' to ' + currency.CodeTo;
            currency.Value = 1 / responses['usd']['buy'].pop()[1];
            currency.Nominal = 1;

            currencies['KGS_USD'] = currency;

            // I buy USD for this amount of KGS
            currency = new Currency();
            currency.Code = 'USD';
            currency.CodeTo = 'KGS';
            currency.Name = currency.Code + ' to ' + currency.CodeTo;
            currency.Value = responses['usd']['sell'].pop()[1];
            currency.Nominal = 1;

            currencies['USD_KGS'] = currency;

            // Cross currencies
            // I buy USD for this amount of RUB
            currency = new Currency();
            currency.Code = 'RUB';
            currency.CodeTo = 'USD';
            currency.Name = currency.Code + ' to ' + currency.CodeTo;
            currency.Value = currencies['RUB_KGS'].Value * currencies['KGS_USD'].Value;
            currency.Nominal = 1;

            currencies['RUB_USD'] = currency;

            // I buy RUB for this amount of USD
            currency = new Currency();
            currency.Code = 'USD';
            currency.CodeTo = 'RUB';
            currency.Name = currency.Code + ' to ' + currency.CodeTo;
            currency.Value = currencies['USD_KGS'].Value * currencies['KGS_RUB'].Value;
            currency.Nominal = 1;

            currencies['USD_RUB'] = currency;


            return currencies;

        }).catch((err) => {
            throw new Error('Can\'t load')
        });
    }

    getSymbols() {
        return {
            "success": true,
            "symbols": {
                "RUB": "Russian Ruble",
                "USD": "United States Dollar"
            }
        };
    }
}

export {
    BanksKgBaitushum
}