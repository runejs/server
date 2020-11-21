import { runGameServer, world } from './game-server';
import 'source-map-support/register';
import { initErrorHandling } from '@server/error-handling';
import { logger } from '@runejs/core';


let killed: boolean = false;

const shutdown = (signal, cb) => {
    if(killed) {
        return;
    }

    killed = true;

    logger.info(`[${signal}] Shutting down...`);

    world?.saveOnlinePlayers();

    cb();
};

['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
    'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
].forEach(signal => process.on(signal as any, () => {
    logger.warn(`${signal} received.`);
    shutdown(signal, () => process.exit());
}));

initErrorHandling();
runGameServer();
