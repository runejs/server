import { world } from '@server/game-server';
import { Actor } from '@server/world/actor/actor';
import { Position } from '../position';
import { Chunk } from '@server/world/map/chunk';
import { Tile } from '@runejs/cache-parser';
import { Player } from '@server/world/actor/player/player';
import { logger } from '@runejs/logger';

class Point {

    private _parent: Point = null;
    private _cost: number = 0;

    public constructor(private readonly _x: number, private readonly _y: number) {
    }

    public equals(point: Point): boolean {
        if(this._cost === point._cost) {
            if(this._parent === null && point._parent !== null) {
                return false;
            } else if(this._parent !== null && !this._parent.equals(point._parent)) {
                return false;
            }

            return this._x === point._x && this._y === point._y;
        }

        return false;
    }

    public get x(): number {
        return this._x;
    }

    public get y(): number {
        return this._y;
    }

    public get parent(): Point {
        return this._parent;
    }

    public set parent(value: Point) {
        this._parent = value;
    }

    public get cost(): number {
        return this._cost;
    }

    public set cost(value: number) {
        this._cost = value;
    }
}

export interface PathingOptions {
    pathingSearchRadius?: number;
    ignoreDestination?: boolean;
}

export class Pathfinding {

    private currentPoint: Point;
    private points: Point[][];
    private closedPoints = new Set<Point>();
    private openPoints = new Set<Point>();
    public stopped = false;

    public constructor(private actor: Actor) {
    }

    public static canMoveNSEW(destinationAdjacency: number[][], destinationLocalX: number, destinationLocalY: number, i: number): boolean {
        return (destinationAdjacency[destinationLocalX][destinationLocalY] & i) === 0;
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

    public async walkTo(position: Position, options: PathingOptions): Promise<void> {
        if(!options.pathingSearchRadius) {
            options.pathingSearchRadius = 16;
        }

        try {
            const path = this.pathTo(position.x, position.y, options.pathingSearchRadius);

            if(!path) {
                return;
            }

            const walkingQueue = this.actor.walkingQueue;

            if(this.actor instanceof Player) {
                this.actor.walkingTo = null;
            }

            walkingQueue.clear();
            walkingQueue.valid = true;

            if(options.ignoreDestination) {
                path.splice(path.length - 1, 1);
            }

            for(const point of path) {
                walkingQueue.add(point.x, point.y);
            }
        } catch(error) {
            logger.error(error);
        }
    }

    public async path(destination: Position, searchRadius: number = 8): Promise<Point[]> {
        const tileMap = await this.createTileMap(searchRadius);

        return null;
    }

    public async createTileMap(searchRadius: number = 8): Promise<{ [key: string]: Tile }> {
        const position = this.actor.position;
        const lowestX = position.x - searchRadius;
        const lowestY = position.y - searchRadius;
        const highestX = position.x + searchRadius;
        const highestY = position.y + searchRadius;

        const chunks: Chunk[] = world.chunkManager.getSurroundingChunks(
            world.chunkManager.getChunkForWorldPosition(position));

        let tiles = [];
        chunks.forEach(chunk => tiles = tiles.concat(...chunk.tileList
            .filter(tile => tile.x >= lowestX && tile.x <= highestX && tile.y >= lowestY && tile.y <= highestY)));

        return Object.fromEntries(
            tiles.map(tile => [ `${tile.x},${tile.y}`, tile ])
        );
    }

    public pathTo(destinationX: number, destinationY: number, searchRadius: number = 16): Point[] {
        const position = this.actor.position;
        const lowestX = position.x - searchRadius;
        const lowestY = position.y - searchRadius;
        const highestX = position.x + searchRadius;
        const highestY = position.y + searchRadius;

        if(destinationX < lowestX || destinationX > highestX || destinationY < lowestY || destinationY > highestY) {
            throw new Error(`Out of range.`);
        }

        const destinationIndexX = destinationX - position.x + searchRadius;
        const destinationIndexY = destinationY - position.y + searchRadius;
        const startingIndexX = searchRadius;
        const startingIndexY = searchRadius;

        const pointLen = searchRadius * 2;

        if(pointLen <= 0) {
            throw new Error(`Why is your search radius zero?`);
        }

        this.points = [...Array(pointLen)].map(e => Array(pointLen));

        for(let x = 0; x < pointLen; x++) {
            for(let y = 0; y < pointLen; y++) {
                this.points[x][y] = new Point(lowestX + x, lowestY + y);
            }
        }

        // Starting point
        this.openPoints = new Set<Point>();
        this.closedPoints = new Set<Point>();
        this.openPoints.add(this.points[startingIndexX][startingIndexY]);

        while(this.openPoints.size > 0) {
            if(this.stopped) {
                return null;
            }

            this.currentPoint = this.calculateBestPoint();

            if(!this.currentPoint || this.currentPoint.equals(this.points[destinationIndexX][destinationIndexY])) {
                break;
            }

            this.openPoints.delete(this.currentPoint);
            this.closedPoints.add(this.currentPoint);

            const level = this.actor.position.level;
            const { x, y } = this.currentPoint;
            const indexX = x - lowestX;
            const indexY = y - lowestY;

            // North-West
            if(indexX > 0 && this.points[indexX - 1] && indexY < this.points[indexX - 1].length - 1) {
                if(this.canPathDiagonally(x, y, new Position(x - 1, y + 1, level), -1, 1,
                    0x1280138, 0x1280108, 0x1280120)) {
                    this.calculateCost(this.points[indexX - 1][indexY + 1]);
                }
            }

            // North-East
            if(indexX < this.points.length - 1 && this.points[indexX + 1] && indexY < this.points[indexX + 1].length - 1) {
                if(this.canPathDiagonally(x, y, new Position(x + 1, y + 1, level), 1, 1,
                    0x12801e0, 0x1280180, 0x1280120)) {
                    this.calculateCost(this.points[indexX + 1][indexY + 1]);
                }
            }

            // South-West
            if(indexX > 0 && indexY > 0 && this.points[indexX - 1]) {
                if(this.canPathDiagonally(x, y,
                    new Position(x - 1, y - 1, level), -1, -1,
                    0x128010e, 0x1280108, 0x1280102)) {
                    this.calculateCost(this.points[indexX - 1][indexY - 1]);
                }
            }

            // South-East
            if(indexX < this.points.length - 1 && indexY > 0 && this.points[indexX + 1]) {
                if(this.canPathDiagonally(x, y, new Position(x + 1, y - 1, level), 1, -1,
                    0x1280183, 0x1280180, 0x1280102)) {
                    this.calculateCost(this.points[indexX + 1][indexY - 1]);
                }
            }

            // West
            if(indexX > 0 && this.canPathNSEW(new Position(x - 1, y, level), 0x1280108)) {
                this.calculateCost(this.points[indexX - 1][indexY]);
            }

            // East
            if(indexX < this.points.length - 1 && this.canPathNSEW(new Position(x + 1, y, level), 0x1280180)) {
                this.calculateCost(this.points[indexX + 1][indexY]);
            }

            // South
            if(indexY > 0 && this.canPathNSEW(new Position(x, y - 1, level), 0x1280102)) {
                this.calculateCost(this.points[indexX][indexY - 1]);
            }

            // North
            if(this.points[indexX] && indexY < this.points[indexX].length - 1 &&
                    this.canPathNSEW(new Position(x, y + 1, level), 0x1280120)) {
                this.calculateCost(this.points[indexX][indexY + 1]);
            }
        }

        const destinationPoint = this.points[destinationIndexX][destinationIndexY];

        if(!destinationPoint || !destinationPoint.parent) {
            // throw new Error(`Unable to find destination point.`);
            return null;
        }

        // build path
        const path: Point[] = [];
        let point = destinationPoint;
        let iterations = 0;

        do {
            if(this.stopped) {
                return null;
            }

            path.push(new Point(point.x, point.y));
            point = point.parent;
            iterations++;

            if(iterations > 1000) {
                throw new Error(`Path iteration overflow, path can not be found.`);
            }

            if(point === null) {
                break;
            }
        } while(!point.equals(this.points[startingIndexX][startingIndexY]));

        return path.reverse();
    }

    private calculateCost(point: Point): void {
        if(!this.currentPoint || !point) {
            return;
        }

        const nextStepCost = this.currentPoint.cost + this.calculateCostBetween(this.currentPoint, point);

        if(nextStepCost < point.cost) {
            this.openPoints.delete(point);
            this.closedPoints.delete(point);
        }

        if(!this.openPoints.has(point) && !this.closedPoints.has(point)) {
            point.parent = this.currentPoint;
            point.cost = nextStepCost;
            this.openPoints.add(point);
        }
    }

    private calculateCostBetween(current: Point, destination: Point): number {
        const deltaX = current.x - destination.x;
        const deltaY = current.y - destination.y;
        return (Math.abs(deltaX) + Math.abs(deltaY)) * 10;
    }

    private calculateBestPoint(): Point {
        let bestPoint: Point = null;

        this.openPoints.forEach(point => {
            if(!bestPoint) {
                bestPoint = point;
            } else if(point.cost < bestPoint.cost) {
                bestPoint = point;
            }
        });

        return bestPoint;
    }

    private canPathNSEW(position: Position, i: number): boolean {
        const chunk = world.chunkManager.getChunkForWorldPosition(position);
        const destinationAdjacency: number[][] = chunk.collisionMap.adjacency;
        const destinationLocalX: number = position.x - chunk.collisionMap.insetX;
        const destinationLocalY: number = position.y - chunk.collisionMap.insetY;
        return Pathfinding.canMoveNSEW(destinationAdjacency, destinationLocalX, destinationLocalY, i);
    }

    private canPathDiagonally(originX: number, originY: number, position: Position, offsetX: number, offsetY: number,
                              destMask: number, cornerMask1: number, cornerMask2: number): boolean {
        const chunk = world.chunkManager.getChunkForWorldPosition(position);
        const destinationAdjacency: number[][] = chunk.collisionMap.adjacency;
        const destinationLocalX: number = position.x - chunk.collisionMap.insetX;
        const destinationLocalY: number = position.y - chunk.collisionMap.insetY;
        return Pathfinding.canMoveDiagonally(position, destinationAdjacency, destinationLocalX, destinationLocalY,
            originX, originY, offsetX, offsetY, destMask, cornerMask1, cornerMask2);
    }


    public canMoveTo(origin: Position, destination: Position): boolean {
        const destinationChunk: Chunk = world.chunkManager.getChunkForWorldPosition(destination);
        const tile: Tile = destinationChunk.getTile(destination);

        if(tile && tile.nonWalkable) {
            return false;
        }

        const initialX: number = origin.x;
        const initialY: number = origin.y;
        const destinationAdjacency: number[][] = destinationChunk.collisionMap.adjacency;
        const destinationLocalX: number = destination.x - destinationChunk.collisionMap.insetX;
        const destinationLocalY: number = destination.y - destinationChunk.collisionMap.insetY;

        // West
        if(destination.x < initialX && destination.y == initialY) {
            if(!Pathfinding.canMoveNSEW(destinationAdjacency, destinationLocalX, destinationLocalY, 0x1280108)) {
                return false;
            }
        }

        // East
        if(destination.x > initialX && destination.y == initialY) {
            if(!Pathfinding.canMoveNSEW(destinationAdjacency, destinationLocalX, destinationLocalY, 0x1280180)) {
                return false;
            }
        }

        // South
        if(destination.y < initialY && destination.x == initialX) {
            if(!Pathfinding.canMoveNSEW(destinationAdjacency, destinationLocalX, destinationLocalY, 0x1280102)) {
                return false;
            }
        }

        // North
        if(destination.y > initialY && destination.x == initialX) {
            if(!Pathfinding.canMoveNSEW(destinationAdjacency, destinationLocalX, destinationLocalY, 0x1280120)) {
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

}
