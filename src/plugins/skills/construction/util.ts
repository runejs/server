import { Player } from '@engine/world/actor/player/player';
import { Coords, Position } from '@engine/world/position';
import { world } from '@engine/game-server';
import { ConstructedRegion } from '@engine/world/map/region';


/**
 * Finds the local coordinates of the room that the player is currently in within their PoH.
 * Returns null if the player is not currently in a custom map region.
 * @param player The player to find the room for.
 */
export const getCurrentRoom = (player: Player): Coords | null => {
    const customMap: ConstructedRegion = player.metadata?.customMap;

    if(!customMap) {
        return null;
    }

    const mapWorldX = customMap.renderPosition.x;
    const mapWorldY = customMap.renderPosition.y;

    const topCornerMapChunk = world.chunkManager.getChunkForWorldPosition(new Position(mapWorldX, mapWorldY, player.position.level));
    const playerChunk = world.chunkManager.getChunkForWorldPosition(player.position);

    const currentRoomX = playerChunk.position.x - (topCornerMapChunk.position.x - 2);
    const currentRoomY = playerChunk.position.y - (topCornerMapChunk.position.y - 2);

    return {
        x: currentRoomX,
        y: currentRoomY,
        level: player.position.level
    };
};
