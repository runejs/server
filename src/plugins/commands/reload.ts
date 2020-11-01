import { commandAction } from '@server/world/action/player-command-action';
import { loadPlugins } from '@server/game-server';
import { loadPackets } from '@server/net/inbound-packets';

const action: commandAction = (details) => {
    const { player } = details;

    player.sendLogMessage('Reloading content...', details.isConsole);

    // Delete node cache for all the old JS plugins
    for(const path in require.cache) {
        if(!path.endsWith('.js')) {
            continue;
        }

        const mustContain = [
            '/plugins/',
            '/inbound-packets/'
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

        const blacklist = [ 'plugin-loader.js', 'plugin.js', 'rune.js' ];
        const invalid = blacklist.some(component => path.endsWith(component) || path.endsWith('.map'));

        if(invalid) {
            continue;
        }

        delete require.cache[path];
    }

    loadPlugins()
        .then(() => player.sendLogMessage('Content reloaded.', details.isConsole))
        .catch(() => player.sendLogMessage('Error reloading content.', details.isConsole));
    loadPackets();
};

export default {
    type: 'player_command', commands: [
    'plugins', 'reload', 'content', 'hotload', 'refresh', 'restart', 'clear', 'r'
], action };
