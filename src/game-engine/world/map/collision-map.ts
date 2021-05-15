import { Chunk } from './chunk';
import { filestore, world } from '../../game-server';
import { WorldInstance } from '@engine/world/instances';
import { LandscapeObject } from '@runejs/filestore';

/**
 * A map of collision masks for a chunk within the game world.
 */
export class CollisionMap {

    private heightLevel: number;
    private x: number;
    private y: number;
    private sizeX: number;
    private sizeY: number;
    private _insetX: number;
    private _insetY: number;
    private _adjacency: number[][];
    private chunk: Chunk;
    private instance: WorldInstance;
    
    public constructor(x: number, y: number, heightLevel: number, options?: { chunk?: Chunk, instance?: WorldInstance }) {
        this.heightLevel = heightLevel;
        this.x = x;
        this.y = y;
        this.sizeX = 8;
        this.sizeY = 8;
        this._insetX = (x + 6) * 8;
        this._insetY = (y + 6) * 8;
        this.chunk = options?.chunk;
        this.instance = options?.instance;
        this._adjacency = new Array(this.sizeX);
        for(let i = 0; i < this.sizeX; i++) {
            this._adjacency[i] = new Array(this.sizeY);
        }
        this.reset();
    }

    public markGameObject(landscapeObject: LandscapeObject, mark: boolean): void {
        const x: number = landscapeObject.x;
        const y: number = landscapeObject.y;
        const objectType = landscapeObject.type;
        const objectOrientation = landscapeObject.orientation;
        const objectDetails = filestore.configStore.objectStore.getObject(landscapeObject.objectId);

        if(objectDetails.solid) {
            if(objectType === 22) {
                if(objectDetails.hasOptions) {
                    this.markBlocked(x, y, mark);
                }
            } else if(objectType >= 9) {
                this.markSolidOccupant(x, y, objectDetails.rendering.sizeX, objectDetails.rendering.sizeY,
                    objectOrientation, objectDetails.nonWalkable, mark);
            } else if(objectType >= 0 && objectType <= 3) {
                if(mark) {
                    this.markWall(x, y, objectType, objectOrientation, objectDetails.nonWalkable);
                } else {
                    this.unmarkWall(x, y, objectType, objectOrientation, objectDetails.nonWalkable);
                }
            }
        }
    }
    
    public reset(): void {
        for(let x = 0; x < this.sizeX; x++) {
            for(let y = 0; y < this.sizeY; y++) {
                this._adjacency[x][y] = this.chunk ? 0 : null;
            }
        }
    }
    
    public markWall(x: number, y: number, type: number, rotation: number, walkable: boolean): void {
        x -= this._insetX;
        y -= this._insetY;
        
        if(type == 0) {
            if(rotation == 0) {
                this.set(x, y, 128);
                this.set(x - 1, y, 8);
            }
            if(rotation == 1) {
                this.set(x, y, 2);
                this.set(x, y + 1, 32);
            }
            if(rotation == 2) {
                this.set(x, y, 8);
                this.set(x + 1, y, 128);
            }
            if(rotation == 3) {
                this.set(x, y, 32);
                this.set(x, y - 1, 2);
            }
        }
        if(type == 1 || type == 3) {
            if(rotation == 0) {
                this.set(x, y, 1);
                this.set(x - 1, y + 1, 16);
            }
            if(rotation == 1) {
                this.set(x, y, 4);
                this.set(x + 1, y + 1, 64);
            }
            if(rotation == 2) {
                this.set(x, y, 16);
                this.set(x + 1, y - 1, 1);
            }
            if(rotation == 3) {
                this.set(x, y, 64);
                this.set(x - 1, y - 1, 4);
            }
        }
        if(type == 2) {
            if(rotation == 0) {
                this.set(x, y, 130);
                this.set(x - 1, y, 8);
                this.set(x, y + 1, 32);
            }
            if(rotation == 1) {
                this.set(x, y, 10);
                this.set(x, y + 1, 32);
                this.set(x + 1, y, 128);
            }
            if(rotation == 2) {
                this.set(x, y, 40);
                this.set(x + 1, y, 128);
                this.set(x, y - 1, 2);
            }
            if(rotation == 3) {
                this.set(x, y, 160);
                this.set(x, y - 1, 2);
                this.set(x - 1, y, 8);
            }
        }
        if(walkable) {
            if(type == 0) {
                if(rotation == 0) {
                    this.set(x, y, 0x10000);
                    this.set(x - 1, y, 4096);
                }
                if(rotation == 1) {
                    this.set(x, y, 1024);
                    this.set(x, y + 1, 16384);
                }
                if(rotation == 2) {
                    this.set(x, y, 4096);
                    this.set(x + 1, y, 0x10000);
                }
                if(rotation == 3) {
                    this.set(x, y, 16384);
                    this.set(x, y - 1, 1024);
                }
            }
            if(type == 1 || type == 3) {
                if(rotation == 0) {
                    this.set(x, y, 512);
                    this.set(x - 1, y + 1, 8192);
                }
                if(rotation == 1) {
                    this.set(x, y, 2048);
                    this.set(x + 1, y + 1, 32768);
                }
                if(rotation == 2) {
                    this.set(x, y, 8192);
                    this.set(x + 1, y - 1, 512);
                }
                if(rotation == 3) {
                    this.set(x, y, 32768);
                    this.set(x - 1, y - 1, 2048);
                }
            }
            if(type == 2) {
                if(rotation == 0) {
                    this.set(x, y, 0x10400);
                    this.set(x - 1, y, 4096);
                    this.set(x, y + 1, 16384);
                }
                if(rotation == 1) {
                    this.set(x, y, 5120);
                    this.set(x, y + 1, 16384);
                    this.set(x + 1, y, 0x10000);
                }
                if(rotation == 2) {
                    this.set(x, y, 20480);
                    this.set(x + 1, y, 0x10000);
                    this.set(x, y - 1, 1024);
                }
                if(rotation == 3) {
                    this.set(x, y, 0x14000);
                    this.set(x, y - 1, 1024);
                    this.set(x - 1, y, 4096);
                }
            }
        }
    }

    public unmarkWall(x: number, y: number, position: number, rotation: number, impenetrable: boolean): void {
        x -= this._insetX;
        y -= this._insetY;
        if(position == 0) {
            if(rotation == 0) {
                this.unset(x, y, 128);
                this.unset(x - 1, y, 8);
            }
            if(rotation == 1) {
                this.unset(x, y, 2);
                this.unset(x, y + 1, 32);
            }
            if(rotation == 2) {
                this.unset(x, y, 8);
                this.unset(x + 1, y, 128);
            }
            if(rotation == 3) {
                this.unset(x, y, 32);
                this.unset(x, y - 1, 2);
            }
        }
        if(position == 1 || position == 3) {
            if(rotation == 0) {
                this.unset(x, y, 1);
                this.unset(x - 1, y + 1, 16);
            }
            if(rotation == 1) {
                this.unset(x, y, 4);
                this.unset(x + 1, y + 1, 64);
            }
            if(rotation == 2) {
                this.unset(x, y, 16);
                this.unset(x + 1, y - 1, 1);
            }
            if(rotation == 3) {
                this.unset(x, y, 64);
                this.unset(x - 1, y - 1, 4);
            }
        }
        if(position == 2) {
            if(rotation == 0) {
                this.unset(x, y, 130);
                this.unset(x - 1, y, 8);
                this.unset(x, y + 1, 32);
            }
            if(rotation == 1) {
                this.unset(x, y, 10);
                this.unset(x, y + 1, 32);
                this.unset(x + 1, y, 128);
            }
            if(rotation == 2) {
                this.unset(x, y, 40);
                this.unset(x + 1, y, 128);
                this.unset(x, y - 1, 2);
            }
            if(rotation == 3) {
                this.unset(x, y, 160);
                this.unset(x, y - 1, 2);
                this.unset(x - 1, y, 8);
            }
        }
        if(impenetrable) {
            if(position == 0) {
                if(rotation == 0) {
                    this.unset(x, y, 0x10000);
                    this.unset(x - 1, y, 4096);
                }
                if(rotation == 1) {
                    this.unset(x, y, 1024);
                    this.unset(x, y + 1, 16384);
                }
                if(rotation == 2) {
                    this.unset(x, y, 4096);
                    this.unset(x + 1, y, 0x10000);
                }
                if(rotation == 3) {
                    this.unset(x, y, 16384);
                    this.unset(x, y - 1, 1024);
                }
            }
            if(position == 1 || position == 3) {
                if(rotation == 0) {
                    this.unset(x, y, 512);
                    this.unset(x - 1, y + 1, 8192);
                }
                if(rotation == 1) {
                    this.unset(x, y, 2048);
                    this.unset(x + 1, y + 1, 32768);
                }
                if(rotation == 2) {
                    this.unset(x, y, 8192);
                    this.unset(x + 1, y - 1, 512);
                }
                if(rotation == 3) {
                    this.unset(x, y, 32768);
                    this.unset(x - 1, y - 1, 2048);
                }
            }
            if(position == 2) {
                if(rotation == 0) {
                    this.unset(x, y, 0x10400);
                    this.unset(x - 1, y, 4096);
                    this.unset(x, y + 1, 16384);
                }
                if(rotation == 1) {
                    this.unset(x, y, 5120);
                    this.unset(x, y + 1, 16384);
                    this.unset(x + 1, y, 0x10000);
                }
                if(rotation == 2) {
                    this.unset(x, y, 20480);
                    this.unset(x + 1, y, 0x10000);
                    this.unset(x, y - 1, 1024);
                }
                if(rotation == 3) {
                    this.unset(x, y, 0x14000);
                    this.unset(x, y - 1, 1024);
                    this.unset(x - 1, y, 4096);
                }
            }
        }
    }
    
    public markSolidOccupant(occupantX: number, occupantY: number, width: number, height: number, rotation: number, walkable: boolean, mark: boolean): void {
        let occupied = 256;
        if(walkable) {
            occupied += 0x20000;
        }

        occupantX -= this._insetX;
        occupantY -= this._insetY;

        if(rotation === 1 || rotation === 3) {
            const off = width;
            width = height;
            height = off;
        }

        for(let x = occupantX; x < occupantX + width; x++) {
            for(let y = occupantY; y < occupantY + height; y++) {
                if(mark) {
                    this.set(x, y, occupied);
                } else {
                    this.unset(x, y, occupied);
                }
            }
        }
    }

    public markBlocked(x: number, y: number, mark: boolean): void {
        x -= this._insetX;
        y -= this._insetY;

        if(this._adjacency[x][y] === null) {
            this._adjacency[x][y] = 0;
        }

        if(mark) {
            this._adjacency[x][y] |= 0x200000;
        } else {
            this._adjacency[x][y] &= 0xdfffff;
        }
    }
    
    public set(x: number, y: number, flag: number): void {
        let outOfBounds = false;

        let offsetX = 0;
        let offsetY = 0;

        if(x < 0) {
            offsetX = -1;
            x = 8 + x;
        } else if(x > 7) {
            offsetX = 1;
            x = x - 8;
        }

        if(y < 0) {
            offsetY = -1;
            y = 8 + y;
        } else if(y > 7) {
            offsetY = 1;
            y = y - 8;
        }

        if(offsetX != 0 || offsetY != 0) {
            this.getSiblingCollisionMap(offsetX, offsetY)?.set(x, y, flag);
            outOfBounds = true;
        }

        if(!outOfBounds) {
            if(this._adjacency[x][y] === null) {
                this._adjacency[x][y] = 0;
            }
            this._adjacency[x][y] |= flag;
        }
    }
    
    public unset(x: number, y: number, flag: number): void {
        let outOfBounds = false;

        if(x < 0) {
            this.getSiblingCollisionMap(-1, 0)?.unset(7, y, flag);
            outOfBounds = true;
        } else if(x > 7) {
            this.getSiblingCollisionMap(1, 0)?.unset(0, y, flag);
            outOfBounds = true;
        }

        if(y < 0) {
            this.getSiblingCollisionMap(0, -1)?.unset(x, 7, flag);
            outOfBounds = true;
        } else if(y > 7) {
            this.getSiblingCollisionMap(0, 1)?.unset(x, 0, flag);
            outOfBounds = true;
        }

        if(!outOfBounds) {
            if(this._adjacency[x][y] === null) {
                this._adjacency[x][y] = 0;
            }
            this._adjacency[x][y] &= 0xffffff - flag;
        }
    }

    public getSiblingCollisionMap(offsetX: number, offsetY: number): CollisionMap {
        if(this.chunk) {
            const offsetChunk: Chunk = world.chunkManager.getChunk({
                x: this.chunk.position.x + offsetX,
                y: this.chunk.position.y + offsetY,
                level: this.heightLevel
            });
            return offsetChunk.collisionMap;
        } else if(this.instance) {
            const instanceChunk = this.instance.getInstancedChunk(this.x + offsetX,
                this.y + offsetY, this.heightLevel);
            return instanceChunk.collisionMap;
        }

        return null;
    }

    public get insetX(): number {
        return this._insetX;
    }

    public get insetY(): number {
        return this._insetY;
    }

    public get adjacency(): number[][] {
        return this._adjacency;
    }
}
