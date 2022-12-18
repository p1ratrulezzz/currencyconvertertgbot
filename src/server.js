'use strict';

import {createServer} from 'node:http'
import * as url from "url";
import {RoutesDefinition} from "./route-definitions.js";
import * as queryString from "querystring";
import {CurrencyConverter} from "./modules/currency-converter/currency-converter.js";
import {FixerPlugin} from "./modules/currency-converter/plugins/fixer-plugin.js";
import {FIXER_API_KEY, SERVER_PORT, SERVER_IP} from "../config.js";

let web = createServer();
let routes = new RoutesDefinition();

let fixerPlugin = new FixerPlugin(FIXER_API_KEY);
let currencyConverter = new CurrencyConverter(fixerPlugin);

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    // 'Access-Control-Allow-Methods': 'GET,POST',
    //'Access-Control-Request-Method': '*',
    "Access-Control-Allow-Headers": '*'
}


const commonHeaders = {
    'Content-Type': 'application/json'
}

function mergeObjects() {
    let result = {};


    for (let i=0; i < arguments.length; i++) {
        Object.assign(result, arguments[i]);
    }

    return result;
}

routes.newRoute('/api/currency-converter/v1/symbols',function (req, res) {
    if (req.method !== 'GET') {
        return endRequestWithError(req, res, 'method_not_allowed', 'only can use GET method');
    }

    res.writeHead(200, mergeObjects(commonHeaders, corsHeaders));
    res.end(JSON.stringify(fixerPlugin.getSymbols()['symbols']));
});

routes.newRoute('/api/currency-converter/v1/currencies',async function (req, res) {
    if (req.method !== 'GET') {
        return endRequestWithError(req, res, 'method_not_allowed', 'only can use GET method');
    }

    res.writeHead(200, mergeObjects(commonHeaders, corsHeaders));
    let currencies = await fixerPlugin.getCurrencies()
    res.end(JSON.stringify(currencies));
});

routes.newRoute('/api/currency-converter/v1/from-to-currencies',async function (req, res) {
    if (req.method !== 'GET') {
        return endRequestWithError(req, res, 'method_not_allowed', 'only can use GET method');
    }

    let urlParsed = url.parse(req.url);
    let queryParsed = queryString.parse(urlParsed.query);

    try {
        if (queryParsed['bases[]'] == null) {
            return endRequestWithError(req, res, 'no_required_params', 'missing some or all of required parameters or it is in wrong format: bases[]');
        }

        let bases = queryParsed['bases[]'];
        bases = bases instanceof Array ? bases : Array(bases);

        let currenciesResult = {};
        let currencyKeys = Object.keys(fixerPlugin.getSymbols()['symbols']);
        if (Boolean(queryParsed['limit_to_bases']) === true) {
            currencyKeys = bases;
        }
        else if (queryParsed['to[]'] != null) {
            currencyKeys = queryParsed['to[]'];
            currencyKeys = currencyKeys instanceof Array ? currencyKeys : Array(currencyKeys);
        }

        for (let ibase = 0; ibase < bases.length; ibase++) {
            for (let icurrency = 0; icurrency < currencyKeys.length; icurrency++) {
                let from = String(bases[ibase]).toUpperCase();
                let to = String(currencyKeys[icurrency]).toUpperCase();

                if (from !== to) {
                    let key = from + '_' + to;
                    currenciesResult[key] = await fixerPlugin.fromToCurrency(from, to);
                }
            }
        }

        res.writeHead(200, mergeObjects(commonHeaders, corsHeaders));
        res.end(JSON.stringify(currenciesResult));
    }
    catch (e) {
        return endRequestWithError(req, res, 'exception', e.message);
    }

});

routes.newRoute('/api/currency-converter/v1/convert',function (req, res) {
    if (req.method !== 'POST') {
        return endRequestWithError(req, res, 'method_not_allowed', 'only can use POST method');
    }

    let body = '';
    req.on('data', (chunk) => {
        body += String(chunk);
    });

    req.on('end', () => {
        if (body.length === 0) {
            return endRequestWithError(req, res, 'empty_request', 'Empty request body');
        }

        try {
            body = JSON.parse(body);

            let response = [];
            let promises = Promise.resolve(response);
            body.forEach((_value) => {
                promises = promises.then((_response) => {
                    return currencyConverter.convert(_value['value_from'], _value['code_from'], _value['code_to']).then((_result) => {
                        _value['value_to'] = _result;
                        _value['type'] = 'converted_item';
                        _response.push(_value);

                        return _response;
                    });
                });
            });

            promises.then((_response) => {
                res.writeHead('200', mergeObjects(commonHeaders, corsHeaders));
                res.end(JSON.stringify(_response));
            }).catch((err) => {
                return endRequestWithError(req, res, 'exception', err.message);
            });

            return promises;
        }
        catch (e) {
            return endRequestWithError(req, res, 'exception', e.message);
        }
    });
});

web.on('request', (req, res) => {
    let urlParsed = url.parse(req.url);

    if (req.method === 'OPTIONS') {
        res.writeHead(200, mergeObjects(commonHeaders, corsHeaders));
        return res.end();
    }

    if (urlParsed.pathname != null) {
        return routes.findRouteHandler(urlParsed.pathname).then((routeHandler) => {
            return routeHandler(req, res, urlParsed);
        }).catch((err) => {
            return endRequestWithError(req, res, 'error_while_handling', 'Error while handling the request');
        });
    }
    else {
        return endRequestWithError(req, res, 'no_handler_for_request', 'no handler for the request');
    }
});

function endRequestWithError(req, res, code, message) {
    let errors = [];

    errors.push({
        code,
        message
    });

    res.writeHead('422', mergeObjects(commonHeaders, corsHeaders));
    res.end(JSON.stringify(errors));
}



web.listen({
    port: SERVER_PORT,
    host: SERVER_IP
}, () => {
    console.log('Server started on ' + SERVER_IP + ':' + SERVER_PORT);
});