import {default as TelegramBot} from "node-telegram-bot-api";
import {CurrencyConverter} from "./modules/currency-converter/currency-converter.js";
import {CbrSourcePlugin} from "./modules/currency-converter/plugins/CbrSourcePlugin.js";
import {createHash} from "node:crypto"

const token = process.env.BOT_TOKEN;

// Create a bot that uses 'polling' to fetch new updates
/**
 * @var bot {TelegramBot}
 */
const bot = new TelegramBot(token, {polling: true});

const CurrencyCodeSource = String(process.env.CURR_SOURCE).toUpperCase();
const CurrencyCodeTo = String(process.env.CURR_TO).toUpperCase();

const cbrSource = new CbrSourcePlugin();
const currConverter = new CurrencyConverter();
currConverter.setSourcePlugin(cbrSource);

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
            let a = 1;
            splitted[i] = ' ' + String(_val);
        }
    });

    return splitted.join('') + decimalValue;
}

function processConvertCommand(text) {
    let amount = String(text).replaceAll(',', '.');
    amount = amount.replaceAll(' ', '');
    amount = parseFloat(amount);

    return currConverter.convert(amount, CurrencyCodeSource, CurrencyCodeTo).then((result) => {
        result = Math.round(result * 100) / 100;
        return Number(amount).prettyPrint() + ' ' + CurrencyCodeSource + ' = ' + result.prettyPrint() + ' ' + CurrencyCodeTo;
    });
}

let currencyTextRegex = /([0-9\., ]+)/i;

bot.onText(currencyTextRegex, (msg, match) => {
    if (match[1] == null) {
        return;
    }
    processConvertCommand(match[1]).then((responseText) => {
        bot.sendMessage(msg.chat.id, responseText);
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

    let hash = createHash('sha256').update(String(Number(new Date())));

    processConvertCommand(match[1]).then((responseText) => {
        bot.answerInlineQuery(msg.id, [{
            type: 'article',
            id: hash.digest('hex'),
            message_text: responseText,
            title: 'Convert ' + String(msg.query) + ' ' + CurrencyCodeSource + ' to ' + CurrencyCodeTo
        }]);
    });
});

