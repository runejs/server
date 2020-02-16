import { itemOnItemAction, ItemOnItemActionPlugin } from '@server/world/mob/player/action/item-on-item-action';
import { world } from '@server/game-server';
import { Skill, skillDetails } from '@server/world/mob/skills';
import { loopingAction } from '@server/world/mob/player/action/action';
import { LandscapeObject } from '@runejs/cache-parser';

const logs = [
    {
        logId: 1511,
        requiredLevel: 1,
        burnExp: 40
    }
];

const failedToLight = (logLevel: number, playerLevel: number): boolean => {
    playerLevel++;
    const hostRatio = Math.random() * logLevel;
    const clientRatio = Math.random() * ((playerLevel - logLevel) * (1 + (logLevel * 0.01)));
    return hostRatio < clientRatio;
};

const action: itemOnItemAction = (details) => {
    const { player, usedItem, usedWithItem, usedSlot, usedWithSlot } = details;
    const tinderBox = usedItem.itemId === 590 ? usedItem : usedWithItem;
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
    const worldItemLog = world.chunkManager.spawnWorldItem(log, player.position, player);

    let elapsedTicks = 0;

    const loop = loopingAction(player);
    loop.event.subscribe(() => {
        if(elapsedTicks === 0 || elapsedTicks % 12 === 0) {
            player.playAnimation(733);
        }

        const lightFire = !failedToLight(skillInfo.requiredLevel, player.skills.values[Skill.WOODCUTTING].level);

        if(lightFire) {
            loop.cancel();

            world.chunkManager.removeWorldItem(worldItemLog);
            const fireObject: LandscapeObject = {
                objectId: 2732,
                x: position.x,
                y: position.y,
                level: position.level,
                type: 10,
                rotation: 0
            };

            world.chunkManager.addLandscapeObject(fireObject, position);
            player.skills.addExp(Skill.FIREMAKING, skillInfo.burnExp);
            player.playAnimation(-1);
        } else {
            elapsedTicks++;
        }
    });
};

export default { items: [ { item1: 590, item2: 1511 } ], action } as ItemOnItemActionPlugin;
