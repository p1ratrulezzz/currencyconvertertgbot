'use strict';

import {XMLParser, XMLBuilder, XMLValidator} from "fast-xml-parser";
import axios from "axios";
import {SourcePluginAbstract} from "./source-plugin-abstract.js";

class CurrencyConverter {

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
        return this._sourcePlugin.findCurrency(codeSource, codeTo).then((currency) => {
            return (currency.Value / currency.Nominal) * value;
        });
    }
}

export {
    CurrencyConverter
}