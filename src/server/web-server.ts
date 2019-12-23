import express from 'express';
import { world } from './game-server';
import { Player } from './world/entity/mob/player/player';
import { constants } from 'http2';
import { logger } from './util/logger';

const WEB_SERVER_PORT = 8888;

export function runWebServer(): void {
    const webServer = express();

    webServer.get('/players', (req, res) => {
        const worldPlayerList: Player[] = world.playerList.filter(p => p !== null);

        if(worldPlayerList.length === 0) {
            res.sendStatus(constants.HTTP_STATUS_NO_CONTENT);
            return;
        }

        res.send(worldPlayerList.map(p => {
            return {
                username: p.username,
                lowDetail: p.isLowDetail,
                clientUUID: p.clientUuid,
                position: {
                    x: p.position.x,
                    y: p.position.y,
                    level: p.position.level
                }
            };
        }));
    });

    webServer.get('/', (req, res) => res.send('Rune.JS Web Server'));

    webServer.listen(WEB_SERVER_PORT, () => logger.info(`REST service listening on port ${WEB_SERVER_PORT}.`));
}
