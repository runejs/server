import { World } from './world/world';
import { logger, parseServerConfig } from '@runejs/core';
import { Cache } from '@runejs/cache-parser';
import { ServerConfig } from '@server/net/server/server-config';

import { loadPlugins } from '@server/plugins/plugin-loader';
import { Action, sort } from '@server/plugins/plugin';

import { setNpcPlugins } from '@server/world/action/npc-action';
import { setObjectPlugins } from '@server/world/action/object-action';
import { setItemOnItemActions } from '@server/world/action/item-on-item-action';
import { setButtonActions } from '@server/world/action/button-action';
import { setCommandActions } from '@server/world/action/input-command-action';
import { setWidgetActions } from '@server/world/action/widget-action';
import { setItemActions } from '@server/world/action/item-action';
import { setWorldItemActions } from '@server/world/action/world-item-action';
import { setItemOnObjectActions } from '@server/world/action/item-on-object-action';
import { setItemOnNpcActions } from '@server/world/action/item-on-npc-action';
import { setPlayerInitPlugins } from '@server/world/actor/player/player';
import { setNpcInitPlugins } from '@server/world/actor/npc/npc';
import { setQuestActions } from '@server/world/config/quests';
import { setPlayerActions } from '@server/world/action/player-action';
import { loadPackets } from '@server/net/inbound-packets';
import { watchForChanges, watchSource } from '@server/util/files';
import { setEquipActions } from '@server/world/action/equip-action';
import { openGameServer } from '@server/net/server/game-server';


export let serverConfig: ServerConfig;
export let cache: Cache;
export let world: World;

export async function injectPlugins(): Promise<void> {
    const actionPluginMap: { [key: string]: Action[] } = {};
    const plugins = await loadPlugins();

    plugins.map(plugin => plugin.actions).reduce((a, b) => a.concat(b)).forEach(action => {
        if(!actionPluginMap.hasOwnProperty(action.type)) {
            actionPluginMap[action.type] = [];
        }

        actionPluginMap[action.type].push(action);
    });

    Object.keys(actionPluginMap).forEach(key => actionPluginMap[key] = sort(actionPluginMap[key]));

    setQuestActions(actionPluginMap.quest);
    setButtonActions(actionPluginMap.button);
    setNpcPlugins(actionPluginMap.npc_action);
    setObjectPlugins(actionPluginMap.object_action);
    setItemOnObjectActions(actionPluginMap.item_on_object);
    setItemOnNpcActions(actionPluginMap.item_on_npc);
    setItemOnItemActions(actionPluginMap.item_on_item);
    setItemActions(actionPluginMap.item_action);
    setEquipActions(actionPluginMap.equip_action);
    setWorldItemActions(actionPluginMap.world_item_action);
    setCommandActions(actionPluginMap.player_command);
    setWidgetActions(actionPluginMap.widget_action);
    setPlayerInitPlugins(actionPluginMap.player_init);
    setNpcInitPlugins(actionPluginMap.npc_init);
    setPlayerActions(actionPluginMap.player_action);
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
        mapData: !serverConfig.clippingDisabled,
        widgets: true
    });

    delete cache.dataChannel;
    delete cache.metaChannel;
    delete cache.indexChannels;
    delete cache.indices;

    await loadPackets();

    world = new World();
    await injectPlugins();

    world.init().then(() => delete cache.mapData);

    if(process.argv.indexOf('-fakePlayers') !== -1) {
        world.generateFakePlayers();
    }

    openGameServer(serverConfig.host, serverConfig.port);

    watchSource('src/').subscribe(() => world.saveOnlinePlayers());
    watchForChanges('dist/plugins/', /[\/\\]plugins[\/\\]/);
    watchForChanges('dist/net/inbound-packets/', /[\/\\]inbound-packets[\/\\]/);
}
