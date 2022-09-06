import { itemOnItemActionHandler } from '@engine/action';
import { itemIds, soundIds, animationIds } from '@engine/world/config';
import { loopingEvent } from '@engine/plugins';
import { FIREMAKING_LOGS } from './data';
import { canChain, canLight } from './chance';
import { lightFire } from './light-fire';
import { runFiremakingTask } from './firemaking-task';

const action: itemOnItemActionHandler = (details) => {
    const { player, usedItem, usedWithItem, usedSlot, usedWithSlot } = details;

    if(player.metadata.lastFire && Date.now() - player.metadata.lastFire < 600) {
        return;
    }

    const log = usedItem.itemId !== itemIds.tinderbox ? usedItem : usedWithItem;
    const removeFromSlot = usedItem.itemId !== itemIds.tinderbox ? usedSlot : usedWithSlot;
    const skillInfo = FIREMAKING_LOGS.find(l => l.logItem.gameId === log.itemId);

    if(!skillInfo) {
        player.sendMessage(`Mishandled firemaking log ${log.itemId}.`);
        return;
    }

    // @TODO check for existing location objects
    // @TODO check firemaking level

    player.removeItem(removeFromSlot);
    const worldItemLog = player.instance.spawnWorldItem(log, player.position, { owner: player, expires: 300 });

    if(player.metadata.lastFire && Date.now() - player.metadata.lastFire < 1200 &&
        canChain(skillInfo.requiredLevel, player.skills.firemaking.level)) {
        lightFire(player, player.position, worldItemLog, skillInfo.experienceGained);
    } else {
        player.sendMessage(`You attempt to light the logs.`);

        runFiremakingTask(player, worldItemLog, skillInfo);
    }
};

export default {
    pluginId: 'rs:firemaking',
    hooks: [
        {
            type: 'item_on_item',
            items: FIREMAKING_LOGS.map(log => ({ item1: itemIds.tinderbox, item2: log.logItem.gameId })),
            handler: action
        }
    ]
};
