import {default as TelegramBot} from "node-telegram-bot-api";
import {CurrencyConverter} from "./modules/currency-converter/currency-converter.js";
import {createHash} from "node:crypto"
import {FixerPlugin} from "./modules/currency-converter/plugins/fixer-plugin.js";
import {BOTS, FIXER_API_KEY} from "../config.js";
import {Logger} from "./modules/logger/logger.js";

Number.prototype.prettyPrint = function() {
    let wholeValue = Math.floor(this);
    let decimalValue = '';

    let dotPos = String(this).lastIndexOf('.');
    if (dotPos !== -1) {
        decimalValue = String(this).substring(dotPos);
    }

    let splitted = String(wholeValue).split('');
    splitted.forEach((_val, i) => {
        _val = parseInt(_val, 10);
        if ((splitted.length - i) % 3 === 0) {
            splitted[i] = ' ' + String(_val);
        }
    });

    return splitted.join('').trim() + decimalValue;
}

let currencyTextRegex = /([0-9\., ]+)/i;

function createBot(botOptions = {}, sourcePlugin, CurrencyCodeSource, CurrencyCodeTo) {
    // Create a bot that uses 'polling' to fetch new updates
    /**
     * @var bot {TelegramBot}
     */
    const bot = new TelegramBot(botOptions.token, {polling: true});

    const currConverter = new CurrencyConverter(sourcePlugin);

    function processConvertCommand(text, sourceCode, toCode) {
        let amount = String(text).replaceAll(',', '.');
        amount = amount.replaceAll(' ', '');
        amount = parseFloat(amount);

        return currConverter.convert(amount, sourceCode, toCode).then((result) => {
            result = Math.round(result * 100) / 100;
            return Number(amount).prettyPrint() + ' ' + sourceCode + ' = ' + result.prettyPrint() + ' ' + toCode;
        });
    }

    bot.onText(currencyTextRegex, (msg, match) => {
        if (match[1] == null) {
            return;
        }

        let amount = match[1];

        let responseTexts = [];
        processConvertCommand(amount, CurrencyCodeSource, CurrencyCodeTo).then((responseText) => {
            responseTexts.push(responseText);
            processConvertCommand(amount, CurrencyCodeTo, CurrencyCodeSource).then((responseText) => {
                responseTexts.push(responseText);

                bot.sendMessage(msg.chat.id, responseTexts.join("\n"));
            });
        });
    });

    bot.onText(/\/start/i, (msg) => {
        bot.sendMessage(msg.chat.id, 'Write some amount in ' + CurrencyCodeSource + ' to convert to ' + CurrencyCodeTo);
    })

    bot.on('inline_query', (msg) => {
        let query = String(msg.query);
        let match = query.match(currencyTextRegex);
        if (match == null || match[1] == null) {
            return;
        }

        let amount = match[1];

        let hash = createHash('sha256').update(String(Number(new Date())) + String(msg.id));

        processConvertCommand(amount, CurrencyCodeSource, CurrencyCodeTo).then((responseText) => {
            let queryAnswers = [];

            queryAnswers.push({
                type: 'article',
                id: hash.copy().update('direct').digest('hex'),
                message_text: responseText,
                title: 'Convert ' + String(msg.query) + ' ' + CurrencyCodeSource + ' to ' + CurrencyCodeTo
            });

            return processConvertCommand(amount, CurrencyCodeTo, CurrencyCodeSource).then((responseText) => {
                queryAnswers.push({
                    type: 'article',
                    id: hash.copy().update('invert').digest('hex'),
                    message_text: responseText,
                    title: 'Convert ' + String(msg.query) + ' ' + CurrencyCodeTo + ' to ' + CurrencyCodeSource
                });

                bot.answerInlineQuery(msg.id, queryAnswers);
            });

        });
    });

    return bot;
}

let i = 1;
let log = new Logger();
BOTS.forEach((botConfig) => {
    let sourcePlugin = new FixerPlugin(FIXER_API_KEY, botConfig.to);
    createBot(botConfig, sourcePlugin, botConfig.source, botConfig.to);
    log.log('Bot ' + String(i++) + ' started');
});

