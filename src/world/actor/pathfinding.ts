import { world } from '@server/game-server';
import { Actor } from '@server/world/actor/actor';
import { Position } from '../position';
import { Chunk } from '@server/world/map/chunk';
import { Tile } from '@runejs/cache-parser';

class Point {

    private _parent: Point = null;
    private _cost: number;
    private _heuristic: number;
    private _depth: number;

    public constructor(private readonly _x: number, private readonly _y: number) {
    }

    public compare(point: Point): number {
        return this._cost - point._cost;
    }

    public equals(point: Point): boolean {
        if(this._cost === point._cost && this._heuristic === point._heuristic && this._depth === point._depth) {
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

    public get heuristic(): number {
        return this._heuristic;
    }

    public set heuristic(value: number) {
        this._heuristic = value;
    }

    public get depth(): number {
        return this._depth;
    }

    public set depth(value: number) {
        this._depth = value;
    }

}

export class Pathfinding {

    private currentPoint: Point;
    private points: Point[][];
    private closedPoints: Point[] = [];
    private openPoints: Point[] = [];

    public constructor(private actor: Actor) {
    }

    public pathTo(destinationX: number, destinationY: number, diameter: number = 32): void {
        // @TODO check if destination is too far away

        const currentPos = this.actor.position;
        const radius = Math.floor(diameter / 2);
        const startX = currentPos.x;
        const startY = currentPos.y;
        const pathingStartX = startX - radius;
        const pathingStartY = startY - radius;

        this.points = new Array(diameter).fill(new Array(diameter));

        for(let x = 0; x < diameter; x++) {
            for(let y = 0; y < diameter; y++) {
                this.points[x][y] = new Point(x + startX, y + startY);
            }
        }

        // Center point
        this.openPoints.push(this.points[radius + 1][radius + 1]);

        while(this.openPoints.length > 0) {
            this.currentPoint = this.calculateBestPoint();

            if(this.currentPoint === this.points[destinationX - pathingStartX][destinationY - pathingStartY]) {
                break;
            }

            this.openPoints.splice(this.openPoints.indexOf(this.currentPoint), 1);
            this.closedPoints.push(this.currentPoint);

            let x = this.currentPoint.x;
            let y = this.currentPoint.y;
            let level = this.actor.position.level;
            let currentPosition = new Position(x, y, level);

            let testPosition = new Position(x - 1, y, level);
            if(this.canMoveTo(currentPosition, testPosition)) {
                const point = this.points[x - 1][y];
            }
        }
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

    private calculateBestPoint(): Point {
        let bestPoint: Point = null;

        for(const point of this.openPoints) {
            if(bestPoint === null) {
                bestPoint = point;
                continue;
            }

            if(point.cost < bestPoint.cost) {
                bestPoint = point;
            }
        }

        return bestPoint;
    }

}
