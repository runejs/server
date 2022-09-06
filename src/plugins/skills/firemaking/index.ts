import { itemOnItemActionHandler } from '@engine/action';
import { itemIds, soundIds, animationIds } from '@engine/world/config';
import { loopingEvent } from '@engine/plugins';
import { FIREMAKING_LOGS } from './data';
import { canChain, canLight } from './chance';
import { lightFire } from './light-fire';

const action: itemOnItemActionHandler = (details) => {
    const { player, usedItem, usedWithItem, usedSlot, usedWithSlot } = details;

    if(player.metadata.lastFire && Date.now() - player.metadata.lastFire < 600) {
        return;
    }

    const log = usedItem.itemId !== itemIds.tinderbox ? usedItem : usedWithItem;
    const removeFromSlot = usedItem.itemId !== itemIds.tinderbox ? usedSlot : usedWithSlot;
    const skillInfo = FIREMAKING_LOGS.find(l => l.logItem.gameId === log.itemId);
    const position = player.position;

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
        lightFire(player, position, worldItemLog, skillInfo.experienceGained);
    } else {
        player.sendMessage(`You attempt to light the logs.`);

        let canLightFire = false;
        let elapsedTicks = 0;
        const loop = loopingEvent({ player });
        loop.event.subscribe(() => {
            if(worldItemLog.removed) {
                loop.cancel();
                return;
            }

            if(canLightFire) {
                loop.cancel();
                player.busy = true;
                setTimeout(() => lightFire(player, position, worldItemLog, skillInfo.experienceGained), 1200);
                return;
            }

            // @TODO check for existing location objects again (in-case one spawned here during this loop)
            // @TODO check for tinderbox in-case it was removed

            if(elapsedTicks === 0 || elapsedTicks % 12 === 0) {
                player.playAnimation(animationIds.lightingFire);
            }

            canLightFire = elapsedTicks > 10 && canLight(skillInfo.requiredLevel, player.skills.firemaking.level);

            if(!canLightFire && (elapsedTicks === 0 || elapsedTicks % 4 === 0)) {
                player.playSound(soundIds.lightingFire, 10, 0);
            } else if(canLightFire) {
                player.playSound(soundIds.fireLit, 7);
            }

            elapsedTicks++;
        });
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
