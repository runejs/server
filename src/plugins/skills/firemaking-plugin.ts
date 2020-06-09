import { itemOnItemAction } from '@server/world/actor/player/action/item-on-item-action';
import { world } from '@server/game-server';
import { loopingAction } from '@server/world/actor/player/action/action';
import { LocationObject } from '@runejs/cache-parser';
import { Player } from '@server/world/actor/player/player';
import { WorldItem } from '@server/world/items/world-item';
import { Position } from '@server/world/position';
import { randomBetween } from '@server/util/num';
import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { objectIds } from '@server/world/config/object-ids';
import { itemIds } from '@server/world/config/item-ids';
import { soundIds } from '@server/world/config/sound-ids';
import { animationIds } from '@server/world/config/animation-ids';

const logs = [
    {
        logId: itemIds.logs,
        requiredLevel: 1,
        burnExp: 40
    }
];

const canLight = (logLevel: number, playerLevel: number): boolean => {
    playerLevel++;
    const hostRatio = Math.random() * logLevel;
    const clientRatio = Math.random() * ((playerLevel - logLevel) * (1 + (logLevel * 0.01)));
    return hostRatio < clientRatio;
};

const canChain = (logLevel: number, playerLevel: number): boolean => {
    playerLevel++;
    const hostRatio = Math.random() * logLevel;
    const clientRatio = Math.random() * ((playerLevel - logLevel) * (1 + (logLevel * 0.01)));
    return clientRatio - hostRatio < 3.5;
};

const fireDuration = (): number => {
    return randomBetween(100, 200); // 1-2 minutes
};

const lightFire = (player: Player, position: Position, worldItemLog: WorldItem, burnExp: number): void => {
    world.removeWorldItem(worldItemLog);
    const fireObject: LocationObject = {
        objectId: objectIds.fire,
        x: position.x,
        y: position.y,
        level: position.level,
        type: 10,
        orientation: 0
    };

    player.playAnimation(null);
    player.sendMessage(`The fire catches and the logs begin to burn.`);
    player.skills.firemaking.addExp(burnExp);

    if(!player.walkingQueue.moveIfAble(-1, 0)) {
        if(!player.walkingQueue.moveIfAble(1, 0)) {
            if(!player.walkingQueue.moveIfAble(0, -1)) {
                player.walkingQueue.moveIfAble(0, 1);
            }
        }
    }
    world.addTemporaryLocationObject(fireObject, position, fireDuration()).then(() => {
        world.spawnWorldItem({ itemId: itemIds.ashes, amount: 1 }, position, null, 300);
    });

    player.face(position, false);
    player.metadata.lastFire = Date.now();
    player.metadata.busy = false;
};

const action: itemOnItemAction = (details) => {
    const { player, usedItem, usedWithItem, usedSlot, usedWithSlot } = details;

    if(player.metadata['lastFire'] && Date.now() - player.metadata['lastFire'] < 600) {
        return;
    }

    const log = usedItem.itemId !== itemIds.tinderbox ? usedItem : usedWithItem;
    const removeFromSlot = usedItem.itemId !== itemIds.tinderbox ? usedSlot : usedWithSlot;
    const skillInfo = logs.find(l => l.logId === log.itemId);
    const position = player.position;

    if(!skillInfo) {
        player.sendMessage(`Mishandled firemaking log ${log.itemId}.`);
        return;
    }

    // @TODO check for existing location objects
    // @TODO check firemaking level

    player.removeItem(removeFromSlot);
    const worldItemLog = world.spawnWorldItem(log, player.position, player, 300);

    if(player.metadata['lastFire'] && Date.now() - player.metadata['lastFire'] < 1200 &&
        canChain(skillInfo.requiredLevel, player.skills.firemaking.level)) {
        lightFire(player, position, worldItemLog, skillInfo.burnExp);
    } else {
        player.sendMessage(`You attempt to light the logs.`);

        let canLightFire = false;
        let elapsedTicks = 0;
        const loop = loopingAction({ player });
        loop.event.subscribe(() => {
            if(worldItemLog.removed) {
                loop.cancel();
                return;
            }

            if(canLightFire) {
                loop.cancel();
                player.metadata.busy = true;
                setTimeout(() => lightFire(player, position, worldItemLog, skillInfo.burnExp), 1200);
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

export default new RunePlugin({
    type: ActionType.ITEM_ON_ITEM_ACTION,
    items: logs.map(log => ({ item1: itemIds.tinderbox, item2: log.logId })),
    action
});
