import { objectAction, ObjectActionPlugin } from '@server/world/mob/player/action/object-action';
import { World } from '@server/world/world';
import { world } from '@server/game-server';
import { Position } from '@server/world/position';
import { LandscapeObject } from '@runejs/cache-parser';


export const action: objectAction = (details) => {
    if (details.player.metadata['busy']) {
        return;
    }
    details.player.face(details.position);

    if ((details.player.metadata['flour'] && details.player.metadata['flour'] === 30) ||
        (details.player.metadata['flour'] && details.player.metadata['grain'] &&
            details.player.metadata['flour'] + details.player.metadata['grain'] >= 30)) {
        details.player.packetSender.chatboxMessage(`There is currently too much flour in the flour bin.`);
        return;
    }
    details.player.metadata['busy'] = true;
    details.player.playAnimation(832);

    setTimeout(() => {
        if (details.player.metadata['grain'] && details.player.metadata['grain'] >= 1) {
            details.player.packetSender.chatboxMessage(`You operate the hopper. The grain slide down the chute.`);
            if (!details.player.metadata['flour']) {
                details.player.metadata['flour'] = 0;
            }
            details.player.metadata['flour'] += details.player.metadata['grain'];
            details.player.metadata['grain'] = 0;
            const flourBinPos = new Position(3166, 3306);
            const fullFlourBin: LandscapeObject = {objectId: 1782, x: 3166, y:3306, rotation: 0, level: 0, type: 10};
            world.chunkManager.addLandscapeObject(fullFlourBin, flourBinPos);
        } else {
            details.player.packetSender.chatboxMessage(`You operate the hopper. Nothing interesting happens.`);
        }
        details.player.metadata['busy'] = false;
    }, World.TICK_LENGTH);

};

export default {objectIds: [2718], options: ['operate'], walkTo: true, action} as ObjectActionPlugin;
