import { objectAction, ObjectActionPlugin } from '@server/world/mob/player/action/object-action';
import { world } from "@server/game-server";


export const action: objectAction = (details) => {
    const oldChunk = world.chunkManager.getChunkForWorldPosition(details.player.position);
    const playerPosition = details.player.position;
    switch (details.option) {
        case 'climb-up':
            playerPosition.move(playerPosition.x, playerPosition.y, playerPosition.level + 1);
            break;
        case 'climb-down':
            playerPosition.move(playerPosition.x, playerPosition.y, playerPosition.level - 1);
            break;
    }

    const newChunk = world.chunkManager.getChunkForWorldPosition(details.player.position);

    details.player.updateFlags.mapRegionUpdateRequired = true;
    details.player.lastMapRegionUpdatePosition = details.player.position;

    if (!oldChunk.equals(newChunk)) {
        oldChunk.removePlayer(details.player);
        newChunk.addPlayer(details.player);
        details.player.chunkChanged(newChunk);
        details.player.packetSender.updateCurrentMapChunk();
    }
};

export default {objectIds: [12964, 12965, 12966], options: ['climb-up', 'climb-down'], walkTo: true, action} as ObjectActionPlugin;
