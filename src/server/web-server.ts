import express, { Request } from 'express';
import { world } from './game-server';
import { Player } from './world/entity/mob/player/player';
import { constants } from 'http2';
import { logger } from '@runejs/logger';

const WEB_SERVER_PORT = 8888;

function handlePagination(req: Request, maxLimit: number, totalItems?: number): { page: number, limit: number } {
    let page = 1;
    let limit = 100;

    if(req.query) {
        const pageInput = req.query['page'];
        const limitInput = req.query['limit'];

        if(pageInput) {
            page = parseInt(pageInput, 10);
        }

        if(limitInput) {
            limit = parseInt(limitInput, 10);
        }

        if(isNaN(page) || page < 1) {
            page = 1;
        }

        if(isNaN(limit) || limit < 1) {
            limit = 1;
        }

        if(limit > maxLimit) {
            limit = maxLimit;
        }

        if(totalItems) {
            const maxPages = Math.ceil(totalItems / limit);

            if(page > maxPages) {
                page = maxPages;
            }
        }
    }

    return { page, limit };
}

interface PaginatedResponse {
    results: any[];
    page: number;
    limit: number;
    totalPages: number;
    totalResults: number;
}

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

    webServer.get('/items', (req, res) => {
        const worldItemList = new Array(...world.itemData.values());
        const totalResults = worldItemList.length;

        const { page, limit } = handlePagination(req, 100, totalResults);

        const start = page * limit - limit;
        const end = start + limit;

        res.send({
            results: worldItemList.slice(start, end),
            page,
            limit,
            totalPages: Math.ceil(totalResults / limit),
            totalResults
        } as PaginatedResponse);
    });

    webServer.get('/', (req, res) => res.send('Rune.JS Web Server'));

    webServer.listen(WEB_SERVER_PORT, () => logger.info(`REST service listening on port ${WEB_SERVER_PORT}.`));
}
