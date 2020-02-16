import { objectAction, ObjectActionPlugin } from '@server/world/mob/player/action/object-action';
import { world } from "@server/game-server";
import { dialogueAction } from "@server/world/mob/player/action/dialogue-action";
import { logger } from "@runejs/logger/dist/logger";


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
        case 'climb':
            dialogueAction(details.player)
                .then(d => d.options(
                    `Climb up or down the ${details.objectDefinition.name.toLowerCase()}?`,
                    [
                        `Climb up the ${details.objectDefinition.name.toLowerCase()}.`,
                        `Climb down the ${details.objectDefinition.name.toLowerCase()}.`
                    ]))
                .then(d => {
                    logger.info(`${d.action}`);
                    d.close();
                    switch(d.action) {
                        case 1:
                            action({
                                player: details.player,
                                object: details.object,
                                objectDefinition: details.objectDefinition,
                                position: details.position,
                                cacheOriginal: details.cacheOriginal,
                                option: 'climb-up'
                            });
                            return;
                        case 2:
                            action({
                                player: details.player,
                                object: details.object,
                                objectDefinition: details.objectDefinition,
                                position: details.position,
                                cacheOriginal: details.cacheOriginal,
                                option: 'climb-down'
                            });
                            return;
                    }
                });
            return;
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
    details.player.packetSender.chatboxMessage(`You climb ${details.option.slice(6)} the ${details.objectDefinition.name.toLowerCase()}.`)
};

export default {objectIds: [12964, 12965, 12966], options: ['climb', 'climb-up', 'climb-down'], walkTo: true, action} as ObjectActionPlugin;
