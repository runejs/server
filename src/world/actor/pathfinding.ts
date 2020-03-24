import { world } from '@server/game-server';
import { Actor } from '@server/world/actor/actor';
import { Position } from '../position';
import { Chunk } from '@server/world/map/chunk';
import { Tile } from '@runejs/cache-parser';

export class Pathfinding {

    public constructor(private actor: Actor) {
    }

    public pathTo(destinationX: number, destinationY: number): void {
        const path: Position[][] = new Array(16).fill(new Array(16));
    }

    public canMoveTo(origin: Position, destination: Position): boolean {
        let destinationChunk: Chunk = world.chunkManager.getChunkForWorldPosition(destination);
        const positionAbove: Position = new Position(destination.x, destination.y, destination.level + 1);
        const chunkAbove: Chunk = world.chunkManager.getChunkForWorldPosition(positionAbove);
        let tile: Tile = chunkAbove.getTile(positionAbove);

        if(!tile || !tile.bridge) {
            tile = destinationChunk.getTile(destination);
        } else {
            // Destination is a bridge, so we need to check the chunk above to get the bridge tiles instead of the level we're currently on
            destinationChunk = chunkAbove;
        }

        if(tile) {
            if(tile.nonWalkable) {
                return false;
            }
        }

        const initialX: number = origin.x;
        const initialY: number = origin.y;
        const destinationAdjacency: number[][] = destinationChunk.collisionMap.adjacency;
        const destinationLocalX: number = destination.x - destinationChunk.collisionMap.insetX;
        const destinationLocalY: number = destination.y - destinationChunk.collisionMap.insetY;

        // @TODO check objects moving from bridge tile to non bridge tile
        // ^ currently possible to clip through some bridge walls thanks to this issue
        // not the most important thing since you still can't walk on water or anything

        // West
        if(destination.x < initialX && destination.y == initialY) {
            if((destinationAdjacency[destinationLocalX][destinationLocalY] & 0x1280108) != 0) {
                return false;
            }
        }

        // East
        if(destination.x > initialX && destination.y == initialY) {
            if((destinationAdjacency[destinationLocalX][destinationLocalY] & 0x1280180) != 0) {
                return false;
            }
        }

        // South
        if(destination.y < initialY && destination.x == initialX) {
            if((destinationAdjacency[destinationLocalX][destinationLocalY] & 0x1280102) != 0) {
                return false;
            }
        }

        // North
        if(destination.y > initialY && destination.x == initialX) {
            if((destinationAdjacency[destinationLocalX][destinationLocalY] & 0x1280120) != 0) {
                return false;
            }
        }

        // South-West
        if(destination.x < initialX && destination.y < initialY) {
            if(!Pathfinding.canMoveDiagonally(origin, destinationAdjacency, destinationLocalX, destinationLocalY, initialX, initialY, -1, -1,
                0x128010e, 0x1280108, 0x1280102)) {
                return false;
            }
        }

        // South-East
        if(destination.x > initialX && destination.y < initialY) {
            if(!Pathfinding.canMoveDiagonally(origin, destinationAdjacency, destinationLocalX, destinationLocalY, initialX, initialY, 1, -1,
                0x1280183, 0x1280180, 0x1280102)) {
                return false;
            }
        }

        // North-West
        if(destination.x < initialX && destination.y > initialY) {
            if(!Pathfinding.canMoveDiagonally(origin, destinationAdjacency, destinationLocalX, destinationLocalY, initialX, initialY, -1, 1,
                0x1280138, 0x1280108, 0x1280120)) {
                return false;
            }
        }

        // North-East
        if(destination.x > initialX && destination.y > initialY) {
            if(!Pathfinding.canMoveDiagonally(origin, destinationAdjacency, destinationLocalX, destinationLocalY, initialX, initialY, 1, 1,
                0x12801e0, 0x1280180, 0x1280120)) {
                return false;
            }
        }

        return true;
    }

    public static canMoveDiagonally(origin: Position, destinationAdjacency: number[][], destinationLocalX: number, destinationLocalY: number,
                                      initialX: number, initialY: number, offsetX: number, offsetY: number, destMask: number, cornerMask1: number, cornerMask2: number): boolean {
        const cornerX1: number = initialX + offsetX;
        const cornerY1: number = initialY;
        const cornerX2: number = initialX;
        const cornerY2: number = initialY + offsetY;
        const corner1 = Pathfinding.calculateLocalCornerPosition(cornerX1, cornerY1, origin);
        const corner2 = Pathfinding.calculateLocalCornerPosition(cornerX2, cornerY2, origin);

        return ((destinationAdjacency[destinationLocalX][destinationLocalY] & destMask) == 0 &&
            (corner1.chunk.collisionMap.adjacency[corner1.localX][corner1.localY] & cornerMask1) == 0 &&
            (corner2.chunk.collisionMap.adjacency[corner2.localX][corner2.localY] & cornerMask2) == 0);
    }

    private static calculateLocalCornerPosition(cornerX: number, cornerY: number, origin: Position): { localX: number, localY: number, chunk: Chunk } {
        const cornerPosition: Position = new Position(cornerX, cornerY, origin.level + 1);
        let cornerChunk: Chunk = world.chunkManager.getChunkForWorldPosition(cornerPosition);
        const tileAbove: Tile = cornerChunk.getTile(cornerPosition);
        if(!tileAbove || !tileAbove.bridge) {
            cornerPosition.level = cornerPosition.level - 1;
            cornerChunk = world.chunkManager.getChunkForWorldPosition(cornerPosition);
        }
        const localX: number = cornerX - cornerChunk.collisionMap.insetX;
        const localY: number = cornerY - cornerChunk.collisionMap.insetY;

        return { localX, localY, chunk: cornerChunk };
    }

}
