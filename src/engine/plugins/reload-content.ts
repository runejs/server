import { sep } from 'path';
import { loadGameConfigurations } from '@engine/config';
import { loadPackets } from '@engine/net';
import { loadPlugins } from '@engine/plugins/loader';
import { logger } from '@runejs/common';
import { Player } from '@engine/world/actor';


export const reloadContentCommands = [
    'plugins', 'reload', 'content', 'hotload', 'refresh', 'restart', 'r'
];

export const reloadContent = async (player: Player, isConsole: boolean = false) => {
    player.sendLogMessage(' ', isConsole);
    player.sendLogMessage('Deleting content cache...', isConsole);

    const includeList = [
        'plugins'
    ].map(p => sep + p + sep);

    const ignoreList = [
        'node_modules',
        'engine',
        'server'
    ].map(p => sep + p + sep);

    const pluginCache: string[] = [];
    const cacheKeys = Object.keys(require.cache);

    // Delete node cache for all the old JS plugins
    cacheLoop:
    for (const cacheKey of cacheKeys) {
        const cachedItem = require.cache[cacheKey];

        if (!cachedItem) {
            continue;
        }

        const path = typeof cachedItem === 'string' ? cachedItem : cachedItem?.path;

        if (!path) {
            continue;
        }

        for (const ignoreItem of ignoreList) {
            if (path.indexOf(ignoreItem) !== -1) {
                continue cacheLoop;
            }
        }

        let includePath = false;

        for (const includeItem of includeList) {
            if (path.indexOf(includeItem) !== -1) {
                includePath = true;
                break;
            }
        }

        if (includePath) {
            pluginCache.push(cacheKey);
        }
    }

    console.log(pluginCache);

    for (const key of pluginCache) {
        delete require.cache[require.resolve(key)];
    }

    try {
        player.sendLogMessage('Reloading plugins...', isConsole);
        await loadPlugins();
    } catch (error) {
        player.sendLogMessage('Error reloading content.', isConsole);
        logger.error(error);
    }

    try {
        player.sendLogMessage('Reloading configurations...', isConsole);
        await loadGameConfigurations();
    } catch (error) {
        player.sendLogMessage('Error reloading configurations.', isConsole);
        logger.error(error);
    }

    try {
        player.sendLogMessage('Reloading packets...', isConsole);
        await loadPackets();
    } catch (error) {
        player.sendLogMessage('Error reloading packets.', isConsole);
        logger.error(error);
    }

    player.sendLogMessage('Reload completed.', isConsole);
};
