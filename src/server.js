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

const goodHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
};

routes.newRoute('/api/currency-converter/v1/symbols',function (req, res) {
    if (req.method !== 'GET') {
        return endRequestWithError(req, res, 'method_not_allowed', 'only can use GET method');
    }

    res.writeHead(200, goodHeaders);
    res.end(JSON.stringify(fixerPlugin.getSymbols()['symbols']));
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
                res.writeHead('200', goodHeaders);
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
    let queryParsed = queryString.parse(urlParsed.query);

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

    res.writeHead('422', {"Content-Type": "application/json"});
    res.end(JSON.stringify(errors));
}



web.listen({
    port: SERVER_PORT,
    host: SERVER_IP
}, () => {
    console.log('Server started on ' + SERVER_IP + ':' + SERVER_PORT);
});