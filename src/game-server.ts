import { World } from './world';
import { logger, parseServerConfig } from '@runejs/core';
import { Cache } from '@runejs/cache-parser';
import { ServerConfig } from '@server/config/server-config';

import { parsePluginFiles } from '@server/plugins/plugin-loader';
import { sort } from '@server/plugins/plugin';

import { loadPackets } from '@server/net/inbound-packets';
import { watchForChanges, watchSource } from '@server/util/files';
import { openGameServer } from '@server/net/server/game-server';
import { loadConfigurations } from '@server/config';
import { Quest } from '@server/world/actor/player/quest';


export let serverConfig: ServerConfig;
export let cache: Cache;
export let world: World;

export let pluginActions: { [key: string]: any } = {};

export async function loadPlugins(): Promise<void> {
    pluginActions = {};
    const plugins = await parsePluginFiles();

    plugins.map(plugin => plugin.actions).reduce((a, b) => a.concat(b)).forEach(action => {
        if(!(action instanceof Quest)) {
            if(!pluginActions[action.type]) {
                pluginActions[action.type] = [];
            }

            pluginActions[action.type].push(action);
        } else {
            if(!pluginActions['quest']) {
                pluginActions['quest'] = [];
            }

            pluginActions['quest'].push(action);
        }
    });

    // @TODO implement proper sorting rules
    Object.keys(pluginActions).forEach(key => pluginActions[key] = sort(pluginActions[key]));
}

export async function runGameServer(): Promise<void> {
    serverConfig = parseServerConfig<ServerConfig>();

    if(!serverConfig) {
        logger.error('Unable to start server due to missing or invalid server configuration.');
        return;
    }

    cache = new Cache('cache', {
        items: true,
        npcs: true,
        locationObjects: true,
        widgets: true
    });

    await loadConfigurations();
    await loadPackets();

    world = new World();
    await world.init();

    if(process.argv.indexOf('-fakePlayers') !== -1) {
        world.generateFakePlayers();
    }

    openGameServer(serverConfig.host, serverConfig.port);

    watchSource('src/').subscribe(() => world.saveOnlinePlayers());
    watchForChanges('dist/plugins/', /[/\\]plugins[/\\]/);
    watchForChanges('dist/net/inbound-packets/', /[/\\]inbound-packets[/\\]/);
}
