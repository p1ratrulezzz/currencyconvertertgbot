import {default as TelegramBot} from "node-telegram-bot-api";
import {CurrencyConverter} from "./modules/currency-converter/currency-converter.js";
import {CbrSourcePlugin} from "./modules/currency-converter/plugins/CbrSourcePlugin.js";

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

bot.onText(/([0-9\., ]+)/i, (msg, match) => {
    let amount = String(match[1]).replaceAll(',', '.');
    amount = String(match[1]).replaceAll(' ', '');
    amount = parseFloat(amount);

    currConverter.convert(amount, CurrencyCodeSource, CurrencyCodeTo).then((result) => {
        result = Math.round(result * 100) / 100;
        bot.sendMessage(msg.chat.id, Number(amount).prettyPrint() + ' ' + CurrencyCodeSource + ' = ' + result.prettyPrint() + ' ' + CurrencyCodeTo);
    });
});

bot.onText(/\/start/i, (msg) => {
    bot.sendMessage(msg.chat.id, 'Write some amount in ' + CurrencyCodeSource + ' to convert to ' + CurrencyCodeTo);
})

