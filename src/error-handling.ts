import { logger } from '@runejs/logger';

/*
 * Error handling! Feel free to add other types of errors or warnings here. :)
 */

export class WidgetsClosedWarning extends Error {
    constructor() {
        super();
        this.name = 'WidgetsClosedWarning';
        this.message = 'The active widget was closed before the action could be completed.';
    }
}

export class ActionsCancelledWarning extends Error {
    constructor() {
        super();
        this.name = 'ActionsCancelledWarning';
        this.message = 'Pending and active actions were cancelled before they could be completed.';
    }
}

const warnings = [
    WidgetsClosedWarning,
    ActionsCancelledWarning
];

export function initErrorHandling(): void {
    process.on('unhandledRejection', (error, promise) => {
        for(const t of warnings) {
            if(error instanceof t) {
                logger.warn(`Promise cancelled with warning: ${error.name}`);
                return;
            }
        }

        logger.error(`Unhandled promise rejection from ${promise}, reason: ${error}`);
        if(error && error.hasOwnProperty('stack')) {
            logger.error((error as any).stack);
        }
    });
}
