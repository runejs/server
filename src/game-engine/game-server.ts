import { World } from './world';
import { logger } from '@runejs/core';
import { parseServerConfig } from '@runejs/core/net';
import { Filestore, LandscapeObject } from '@runejs/filestore';

import { ServerConfig } from '@engine/config/server-config';
import { loadPluginFiles } from '@engine/plugins/content-plugin';
import { loadPackets } from '@engine/net/inbound-packets';
import { watchForChanges, watchSource } from '@engine/util/files';
import { openGameServer } from '@engine/net/server/game-server';
import { loadCoreConfigurations, loadGameConfigurations, xteaRegions } from '@engine/config';
import { Quest } from '@engine/world/actor/player/quest';
import { Npc } from '@engine/world/actor/npc/npc';
import { Player } from '@engine/world/actor/player/player';
import { Subject, timer } from 'rxjs';
import { Position } from '@engine/world/position';
import { ActionHook, sortActionHooks } from '@engine/world/action/hooks';
import { ActionType } from '@engine/world/action';


/**
 * The singleton instance containing the server's active configuration settings.
 */
export let serverConfig: ServerConfig;


/**
 * The singleton instance referencing the game's asset filestore.
 */
export let filestore: Filestore;


/**
 * The singleton instance of this game world.
 */
export let world: World;


/**
 * A type for describing the plugin action hook map.
 */
type PluginActionHookMap = {
    [key in ActionType]?: ActionHook[];
};


/**
 * A type for describing the plugin action hook map.
 */
interface PluginQuestMap {
    [key: string]: Quest;
}


/**
 * A list of action hooks imported from content plugins.
 */
export let actionHookMap: PluginActionHookMap = {};


/**
 * A list of quests imported from content plugins.
 */
export let questMap: PluginQuestMap = {};


/**
 * Searches for and loads all plugin files and their associated action hooks.
 */
export async function loadPlugins(): Promise<void> {
    actionHookMap = {};
    questMap = {};
    const plugins = await loadPluginFiles();

    const pluginActionHookList = plugins?.filter(plugin => !!plugin?.hooks)?.map(plugin => plugin.hooks);

    if(pluginActionHookList && pluginActionHookList.length !== 0) {
        pluginActionHookList.reduce(
            (a, b) => a.concat(b))?.forEach(action => {
            if(!(action instanceof Quest)) {
                if(!actionHookMap[action.type]) {
                    actionHookMap[action.type] = [];
                }

                actionHookMap[action.type].push(action);
            } else {
                if(!actionHookMap['quest']) {
                    actionHookMap['quest'] = [];
                }

                actionHookMap['quest'].push(action);
            }
        });
    } else {
        logger.warn(`No action hooks detected - update plugins.`);
    }

    const pluginQuestList = plugins?.filter(plugin => !!plugin?.quests)?.map(plugin => plugin.quests);

    if(pluginQuestList && pluginQuestList.length > 0) {
        pluginQuestList.reduce((prev, curr) => prev.concat(curr))
            .forEach(quest => questMap[quest.id] = quest);
    }

    // @TODO implement proper sorting rules
    Object.keys(actionHookMap)
        .forEach(key => actionHookMap[key] =
            sortActionHooks(actionHookMap[key]));
}


/**
 * Configures the game server, parses the asset filestore,
 * awakens the game world, and finally initializes the
 * game socket server.
 */
export async function runGameServer(): Promise<void> {
    serverConfig = parseServerConfig<ServerConfig>();

    if(!serverConfig) {
        logger.error('Unable to start server due to missing or invalid server configuration.');
        return;
    }

    await loadCoreConfigurations();
    filestore = new Filestore('cache', { xteas: xteaRegions });

    await loadGameConfigurations();

    await loadPackets();

    world = new World();
    await world.init();

    if(process.argv.indexOf('-fakePlayers') !== -1) {
        world.generateFakePlayers();
    }

    openGameServer(serverConfig.host, serverConfig.port);

    watchSource('src/').subscribe(() => world.saveOnlinePlayers());
    watchForChanges('dist/plugins/', /[/\\]plugins[/\\]/);
}



/**
 * A type of action that loops until either one of three things happens:
 * 1. A player is specified within `options` who's `actionsCancelled` event has been fired during the loop.
 * 2. An npc is specified within `options` who no longer exists at some point during the loop.
 * 3. The `cancel()` function is manually called, presumably when the purpose of the loop has been completed.
 * @param options Options to provide to the looping action, which include:
 * `ticks` the number of game ticks between loop cycles. Defaults to 1 game tick between loops.
 * `delayTicks` the number of game ticks to wait before starting the first loop. Defaults to 0 game ticks.
 * `player` the player that the loop belongs to. Providing this field will cause the loop to cancel if this
 *          player's `actionsCancelled` is fired during the loop.
 * `npc` the npc that the loop belongs to. This will Providing this field will cause the loop to cancel if
 *       this npc is flagged to no longer exist during the loop.
 * @deprecated - use new Action Hook task system instead.
 */
export const loopingEvent = (options?: {
    ticks?: number;
    delayTicks?: number;
    npc?: Npc;
    player?: Player;
}): { event: Subject<void>, cancel: () => void } => {
    if(!options) {
        options = {};
    }

    const { ticks, delayTicks, npc, player } = options;
    const event: Subject<void> = new Subject<void>();

    const subscription = timer(delayTicks === undefined ? 0 : (delayTicks * World.TICK_LENGTH),
        ticks === undefined ? World.TICK_LENGTH : (ticks * World.TICK_LENGTH)).subscribe(() => {
        if(npc && !npc.exists) {
            event.complete();
            subscription.unsubscribe();
            return;
        }

        event.next();
    });

    let actionCancelled;

    if(player) {
        actionCancelled = player.actionsCancelled.subscribe(() => {
            subscription.unsubscribe();
            actionCancelled.unsubscribe();
            event.complete();
        });
    }

    return {
        event, cancel: () => {
            subscription.unsubscribe();

            if(actionCancelled) {
                actionCancelled.unsubscribe();
            }

            event.complete();
        }
    };
};


/**
 * A walk-to type of action that requires the specified player to walk to a specific destination before proceeding.
 * Note that this does not force the player to walk, it simply checks to see if the player is walking where specified.
 * @param player The player that must walk to a specific position.
 * @param position The position that the player needs to end up at.
 * @param interactingAction [optional] The information about the interaction that the player is making. Not required.
 * @deprecated - use methods provided within the Actor API to force or await movement
 */
export const playerWalkTo = async (player: Player, position: Position, interactingAction?: {
    interactingObject?: LandscapeObject;
}): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
        player.metadata.walkingTo = position;

        const inter = setInterval(() => {
            if(!player.metadata.walkingTo || !player.metadata.walkingTo.equals(position)) {
                reject();
                clearInterval(inter);
                return;
            }

            if(!player.walkingQueue.moving()) {
                if(!interactingAction) {
                    if(player.position.distanceBetween(position) > 1) {
                        reject();
                    } else {
                        resolve();
                    }
                } else {
                    if(interactingAction.interactingObject) {
                        const locationObject = interactingAction.interactingObject;
                        if(player.position.withinInteractionDistance(locationObject)) {
                            resolve();
                        } else {
                            reject();
                        }
                    }
                }

                clearInterval(inter);
                player.metadata.walkingTo = null;
            }
        }, 100);
    });
};
