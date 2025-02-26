const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logFile = path.join(__dirname, '../../logs/bot.log');
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        const dir = path.dirname(this.logFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    formatMessage(level, message, extra) {
        const timestamp = new Date().toISOString();
        let logMessage = `[${timestamp}] [${level}] ${message}`;
        if (extra) {
            logMessage += '\n' + JSON.stringify(extra, null, 2);
        }
        return logMessage;
    }

    log(level, message, extra) {
        const logMessage = this.formatMessage(level, message, extra);
        console.log(logMessage);
        fs.appendFileSync(this.logFile, logMessage + '\n');
    }

    info(message, extra) {
        this.log('INFO', message, extra);
    }

    error(message, extra) {
        this.log('ERROR', message, extra);
    }

    warn(message, extra) {
        this.log('WARN', message, extra);
    }
}

exports.logger = new Logger();
