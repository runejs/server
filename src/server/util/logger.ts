import moment from 'moment';
import { gray, red, yellow, cyan } from 'colors';

const DATE_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

function log(message: string, consoleType: string, emptyLine?: boolean) {
    const date = moment().format(DATE_FORMAT);

    const str = gray(`[${date}]: `) + message;

    console[consoleType](str);

    if(emptyLine) {
        console.info('');
    }
}

export const logger = {
    info: (message: string, emptyLine?: boolean) => {
        log(message, 'info', emptyLine);
    },
    debug: (message: string, emptyLine?: boolean) => {
        log(cyan(message), 'info', emptyLine);
    },
    warn: (message: string, emptyLine?: boolean) => {
        log(yellow(message), 'warn', emptyLine);
    },
    error: (message: string, emptyLine?: boolean) => {
        log(red(message), 'error', emptyLine);
    }
};
