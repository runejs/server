import { itemOnItemAction } from '@server/world/mob/player/action/item-on-item-action';
import { world } from '@server/game-server';
import { Skill } from '@server/world/mob/skills';
import { loopingAction } from '@server/world/mob/player/action/action';
import { LandscapeObject } from '@runejs/cache-parser';
import { Player } from '@server/world/mob/player/player';
import { WorldItem } from '@server/world/items/world-item';
import { Position } from '@server/world/position';
import { randomBetween } from '@server/util/num';
import { ActionType, RunePlugin } from '@server/plugins/plugin';

const logs = [
    {
        logId: 1511,
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
    world.chunkManager.removeWorldItem(worldItemLog);
    const fireObject: LandscapeObject = {
        objectId: 2732,
        x: position.x,
        y: position.y,
        level: position.level,
        type: 10,
        rotation: 0
    };

    world.chunkManager.addTemporaryLandscapeObject(fireObject, position, fireDuration()).then(() => {
        world.chunkManager.spawnWorldItem({ itemId: 592, amount: 1 }, position, null, 300);
    });
    player.packetSender.playSound(2594, 7);
    player.playAnimation(null);
    player.packetSender.chatboxMessage(`The fire catches and the logs begin to burn.`);
    player.skills.addExp(Skill.FIREMAKING, burnExp);

    if(!player.walkingQueue.moveIfAble(-1, 0)) {
        if(!player.walkingQueue.moveIfAble(1, 0)) {
            if(!player.walkingQueue.moveIfAble(0, -1)) {
                player.walkingQueue.moveIfAble(0, 1);
            }
        }
    }

    player.face(position, false);
    player.metadata['lastFire'] = Date.now();
};

const action: itemOnItemAction = (details) => {
    const { player, usedItem, usedWithItem, usedSlot, usedWithSlot } = details;

    if(player.metadata['lastFire'] && Date.now() - player.metadata['lastFire'] < 600) {
        return;
    }

    const log = usedItem.itemId !== 590 ? usedItem : usedWithItem;
    const removeFromSlot = usedItem.itemId !== 590 ? usedSlot : usedWithSlot;
    const skillInfo = logs.find(l => l.logId === log.itemId);
    const position = player.position;

    if(!skillInfo) {
        player.packetSender.chatboxMessage(`Mishandled firemaking log ${log.itemId}.`);
        return;
    }

    // @TODO check for existing location objects
    // @TODO check firemaking level

    player.removeItem(removeFromSlot);
    const worldItemLog = world.chunkManager.spawnWorldItem(log, player.position, player, 300);

    if(player.metadata['lastFire'] && Date.now() - player.metadata['lastFire'] < 1200 && canChain(skillInfo.requiredLevel, player.skills.values[Skill.WOODCUTTING].level)) {
        lightFire(player, position, worldItemLog, skillInfo.burnExp);
    } else {
        player.packetSender.chatboxMessage(`You attempt to light the logs.`);

        let elapsedTicks = 0;
        const loop = loopingAction(player);
        loop.event.subscribe(() => {
            if(worldItemLog.removed) {
                loop.cancel();
                return;
            }

            // @TODO check for existing location objects again (in-case one spawned here during this loop)
            // @TODO check for tinderbox in-case it was removed

            if(elapsedTicks === 0 || elapsedTicks % 12 === 0) {
                player.playAnimation(733);
            }

            const canLightFire = elapsedTicks > 10 && canLight(skillInfo.requiredLevel, player.skills.values[Skill.WOODCUTTING].level);

            if(!canLightFire && (elapsedTicks === 0 || elapsedTicks % 4 === 0)) {
                player.packetSender.playSound(2599, 7);
            }

            if(canLightFire) {
                loop.cancel();
                lightFire(player, position, worldItemLog, skillInfo.burnExp);
            } else {
                elapsedTicks++;
            }
        });
    }
};

export default new RunePlugin({ type: ActionType.ITEM_ON_ITEM, items: [ { item1: 590, item2: 1511 } ], action });
