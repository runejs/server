import { runGameServer, world } from './game-server';
import 'source-map-support/register';
import { initErrorHandling } from '@server/error-handling';
import { logger } from '@runejs/logger';

const shutdown = (signal, cb) => {
    logger.info(`[${signal}] Shutting down...`);

    if(world && world.playerList) {
        world.playerList.filter(player => player !== null).forEach(player => {
            player.logout();
            if(player.socket) {
                player.socket.destroy();
            }
        });
        logger.info(`Online players saved.`);
    }

    cb();
};

['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
    'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
].forEach(signal => process.on(signal as any, () => {
    logger.warn(`${signal} received.`);
    shutdown(signal, () => process.kill(process.pid, signal));
}));

initErrorHandling();
runGameServer();
