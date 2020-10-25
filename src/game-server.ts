import { World } from './world/world';
import { logger, parseServerConfig } from '@runejs/core';
import { Cache } from '@runejs/cache-parser';
import { ServerConfig } from '@server/net/server/server-config';

import { loadPlugins } from '@server/plugins/plugin-loader';
import { ActionPlugin, ActionType, sort } from '@server/plugins/plugin';

import { setNpcPlugins } from '@server/world/actor/player/action/npc-action';
import { setObjectPlugins } from '@server/world/actor/player/action/object-action';
import { setItemOnItemPlugins } from '@server/world/actor/player/action/item-on-item-action';
import { setButtonPlugins } from '@server/world/actor/player/action/button-action';
import { setCommandPlugins } from '@server/world/actor/player/action/input-command-action';
import { setWidgetPlugins } from '@server/world/actor/player/action/widget-action';
import { setItemPlugins } from '@server/world/actor/player/action/item-action';
import { setWorldItemPlugins } from '@server/world/actor/player/action/world-item-action';
import { setItemOnObjectPlugins } from '@server/world/actor/player/action/item-on-object-action';
import { setItemOnNpcPlugins } from '@server/world/actor/player/action/item-on-npc-action';
import { setPlayerInitPlugins } from '@server/world/actor/player/player';
import { setNpcInitPlugins } from '@server/world/actor/npc/npc';
import { setQuestPlugins } from '@server/world/config/quests';
import { setPlayerPlugins } from '@server/world/actor/player/action/player-action';
import { loadPackets } from '@server/net/inbound-packets';
import { watchForChanges, watchSource } from '@server/util/files';
import { setEquipPlugins } from '@server/world/actor/player/action/equip-action';
import { openGameServer } from '@server/net/server/game-server';


export let serverConfig: ServerConfig;
export let cache: Cache;
export let world: World;

export async function injectPlugins(): Promise<void> {
    const actionPluginMap: { [key: string]: ActionPlugin[] } = {};
    const plugins = await loadPlugins();

    plugins.map(plugin => plugin.actions).reduce((a, b) => a.concat(b)).forEach(action => {
        if(!actionPluginMap.hasOwnProperty(action.type)) {
            actionPluginMap[action.type] = [];
        }

        actionPluginMap[action.type].push(action);
    });

    Object.keys(actionPluginMap).forEach(key => actionPluginMap[key] = sort(actionPluginMap[key]));

    setQuestPlugins(actionPluginMap[ActionType.QUEST]);
    setButtonPlugins(actionPluginMap[ActionType.BUTTON]);
    setNpcPlugins(actionPluginMap[ActionType.NPC_ACTION]);
    setObjectPlugins(actionPluginMap[ActionType.OBJECT_ACTION]);
    setItemOnObjectPlugins(actionPluginMap[ActionType.ITEM_ON_OBJECT_ACTION]);
    setItemOnNpcPlugins(actionPluginMap[ActionType.ITEM_ON_NPC_ACTION]);
    setItemOnItemPlugins(actionPluginMap[ActionType.ITEM_ON_ITEM_ACTION]);
    setItemPlugins(actionPluginMap[ActionType.ITEM_ACTION]);
    setEquipPlugins(actionPluginMap[ActionType.EQUIP_ACTION]);
    setWorldItemPlugins(actionPluginMap[ActionType.WORLD_ITEM_ACTION]);
    setCommandPlugins(actionPluginMap[ActionType.COMMAND]);
    setWidgetPlugins(actionPluginMap[ActionType.WIDGET_ACTION]);
    setPlayerInitPlugins(actionPluginMap[ActionType.PLAYER_INIT]);
    setNpcInitPlugins(actionPluginMap[ActionType.NPC_INIT]);
    setPlayerPlugins(actionPluginMap[ActionType.PLAYER_ACTION]);
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
