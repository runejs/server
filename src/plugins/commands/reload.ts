import { commandActionHandler } from '@engine/world/action/player-command.action';
import { loadPlugins } from '@engine/game-server';
import { loadPackets } from '@engine/net/inbound-packets';
import { loadConfigurations } from '@engine/config';
import { logger } from '@runejs/core';

const action: commandActionHandler = async (details) => {
    const { player } = details;

    player.sendLogMessage(' ', details.isConsole);
    player.sendLogMessage('Deleting content cache...', details.isConsole);

    // Delete node cache for all the old JS plugins
    for(const path in require.cache) {
        if(!require.cache.hasOwnProperty(path)) {
            continue;
        }

        if(!path.endsWith('.js')) {
            continue;
        }

        const mustContain = [
            '/plugins/'
        ];

        if(path.indexOf('node_modules') !== -1) {
            continue;
        }

        let found = false;
        for(const s of mustContain) {
            if(path.indexOf(s) !== -1) {
                found = true;
                break;
            }
        }

        if(!found) {
            continue;
        }

        delete require.cache[path];
    }

    try {
        player.sendLogMessage('Reloading plugins...', details.isConsole);
        await loadPlugins();
    } catch(error) {
        player.sendLogMessage('Error reloading content.', details.isConsole);
        logger.error(error);
    }

    try {
        player.sendLogMessage('Reloading configurations...', details.isConsole);
        await loadConfigurations();
    } catch(error) {
        player.sendLogMessage('Error reloading configurations.', details.isConsole);
        logger.error(error);
    }

    try {
        player.sendLogMessage('Reloading packets...', details.isConsole);
        await loadPackets();
    } catch(error) {
        player.sendLogMessage('Error reloading packets.', details.isConsole);
        logger.error(error);
    }

    player.sendLogMessage('Reload completed.', details.isConsole);
};

export default {
    type: 'player_command', commands: [
        'plugins', 'reload', 'content', 'hotload', 'refresh', 'restart', 'r'
    ], handler: action };
