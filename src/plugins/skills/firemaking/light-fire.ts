import { randomBetween } from '@engine/util';
import { Position, WorldItem } from '@engine/world';
import { Player } from '@engine/world/actor';
import { objectIds, itemIds } from '@engine/world/config';
import { LandscapeObject } from '@runejs/filestore';

const fireDurationTicks = (): number => {
    return randomBetween(100, 200); // 1-2 minutes
};

export const lightFire = (player: Player, position: Position, worldItemLog: WorldItem, burnExp: number): void => {
    player.instance.despawnWorldItem(worldItemLog);
    const fireObject: LandscapeObject = {
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

    player.instance.spawnTemporaryGameObject(fireObject, position, fireDurationTicks()).then(() => {
        player.instance.spawnWorldItem({ itemId: itemIds.ashes, amount: 1 }, position, { expires: 300 });
    });

    player.face(position, false);
    player.metadata.lastFire = Date.now();
    player.metadata.busy = false;
};
