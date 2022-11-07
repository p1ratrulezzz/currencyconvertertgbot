'use strict';

import {SourcePluginAbstract} from "./source-plugin-abstract.js";

class CurrencyConverter {

    constructor(plugin) {
        this.setSourcePlugin(plugin);
    }

    /**
     *
     * @type {SourcePluginAbstract}
     * @private
     */
    _sourcePlugin = null;

    setSourcePlugin(plugin) {
        this._sourcePlugin = plugin;
    }

    /**
     *
     * @param value
     * @param codeSource
     * @param codeTo
     * @returns {Promise}
     */
    convert(value, codeSource, codeTo) {
        return this._sourcePlugin.fromToCurrency(codeSource, codeTo).then((currency) => {
            return (currency.Value / currency.Nominal) * value;
        });
    }
}

export {
    CurrencyConverter
}