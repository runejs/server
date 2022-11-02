import { itemOnItemActionHandler, ItemOnItemActionHook, ItemOnWorldItemActionHook } from '@engine/action';
import { itemIds } from '@engine/world/config';
import { FIREMAKING_LOGS } from './data';
import { canChain } from './chance';
import { canLightFireAtCurrentPosition, lightFire } from './light-fire';
import { runFiremakingTask } from './firemaking-task';

/**
 * Action hook for lighting a log with a tinderbox in the player's inventory.
 */
const tinderboxOnLogHandler: itemOnItemActionHandler = (details) => {
    const { player, usedItem, usedWithItem, usedSlot, usedWithSlot } = details;

    if (player.metadata.lastFire && Date.now() - player.metadata.lastFire < 600) {
        return;
    }

    const log = usedItem.itemId !== itemIds.tinderbox ? usedItem : usedWithItem;
    const removeFromSlot = usedItem.itemId !== itemIds.tinderbox ? usedSlot : usedWithSlot;
    const skillInfo = FIREMAKING_LOGS.find(l => l.logItem.gameId === log.itemId);

    if (!skillInfo) {
        player.sendMessage(`Mishandled firemaking log ${log.itemId}.`);
        return;
    }

    if (player.skills.firemaking.level < skillInfo.requiredLevel) {
        player.sendMessage(`You need a Firemaking level of ${skillInfo.requiredLevel} to light this log.`);
        return;
    }

    if (!canLightFireAtCurrentPosition(player)) {
        player.sendMessage('You cannot light a fire here.');
        return;
    }

    player.removeItem(removeFromSlot);
    const worldItemLog = player.instance.spawnWorldItem(log, player.position, { owner: player, expires: 300 });

    // TODO (jameskmonger) chaining functionality needs documentation, I can't find anything about it online
    if (player.metadata.lastFire && Date.now() - player.metadata.lastFire < 1200 &&
        canChain(skillInfo.requiredLevel, player.skills.firemaking.level)) {
        lightFire(player, player.position, worldItemLog, skillInfo.experienceGained);
    } else {
        player.sendMessage('You attempt to light the logs.');

        runFiremakingTask(player, worldItemLog);
    }
};

/**
 * Firemaking plugin
 *
 * TODO:
 * - Document/remove `canChain` functionality - this is not documented anywhere online (RS wiki etc)
 */
export default {
    pluginId: 'rs:firemaking',
    hooks: [
        {
            type: 'item_on_item',
            items: FIREMAKING_LOGS.map(log => ({ item1: itemIds.tinderbox, item2: log.logItem.gameId })),
            handler: tinderboxOnLogHandler
        } as ItemOnItemActionHook,
        {
            type: 'item_on_world_item',
            items: FIREMAKING_LOGS.map(log => ({ item: itemIds.tinderbox, worldItem: log.logItem.gameId })),
            handler: ({ player, usedWithItem }) => {
                runFiremakingTask(player, usedWithItem);
            }
        } as ItemOnWorldItemActionHook
    ]
};
