'use strict';

class Logger {
    /**
     * @public
     */
    log() {
        return console.log.call(console, ...arguments);
    }
}

export {
    Logger
}