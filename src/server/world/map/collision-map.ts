import { Chunk } from './chunk';
import { world } from '../../game-server';
import { Position } from '../position';

/**
 * A map of collision masks for a chunk within the game world.
 */
export class CollisionMap {

    private sizeX: number;
    private sizeY: number;
    private insetX: number;
    private insetY: number;
    private adjacency: number[][];
    private chunk: Chunk;
    
    public constructor(sizeX: number, sizeY: number, insetX: number, insetY: number, chunk: Chunk) {
        this.sizeX = sizeX;
        this.sizeY = sizeY;
        this.insetX = insetX;
        this.insetY = insetY;
        this.chunk = chunk;
        this.adjacency = new Array(this.sizeX);
        for(let i = 0; i < this.sizeX; i++) {
            this.adjacency[i] = new Array(this.sizeY);
        }
        this.reset();
    }
    
    public reset(): void {
        for(let x = 0; x < this.sizeX; x++) {
            for(let y = 0; y < this.sizeY; y++) {
                if(x == 0 || y == 0 || x == this.sizeX - 1 || y == this.sizeY - 1) {
                    this.adjacency[x][y] = //0xffffff;
                        0;
                } else {
                    this.adjacency[x][y] = //0x1000000;
                        0;
                }
            }
        }
    }
    
    public markWall(x: number, y: number, type: number, rotation: number, walkable: boolean): void {
        x -= this.insetX;
        y -= this.insetY;
        
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
        x -= this.insetX;
        y -= this.insetY;
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
    
    // @TODO consolodate with unmarkSolidOccupant via boolean param
    public markSolidOccupant(occupantX: number, occupantY: number, width: number, height: number, rotation: number, impenetrable: boolean): void {
        let occupied = 256;
        if(impenetrable) {
            occupied += 0x20000;
        }
        occupantX -= this.insetX;
        occupantY -= this.insetY;

        if(rotation == 1 || rotation == 3) {
            let off = width;
            width = height;
            height = off;
        }
        
        for(let x = occupantX; x < occupantX + width; x++) {
            for(let y = occupantY; y < occupantY + height; y++) {
                this.set(x, y, occupied);
            }
        }
    }

    // @TODO consolodate with markSolidOccupant via boolean param
    public unmarkSolidOccupant(occupantX: number, occupantY: number, width: number, height: number, rotation: number, impenetrable: boolean): void {
        let occupied = 256;
        if(impenetrable) {
            occupied += 0x20000;
        }
        occupantX -= this.insetX;
        occupantY -= this.insetY;
        
        if(rotation == 1 || rotation == 3) {
            let off = width;
            width = height;
            height = off;
        }

        for(let x = occupantX; x < occupantX + width; x++) {
            for(let y = occupantY; y < occupantY + height; y++) {
                this.unset(x, y, occupied);
            }
        }
    }

    // @TODO consolodate with unmarkBlocked via boolean param
    public markBlocked(x: number, y: number): void {
        x -= this.insetX;
        y -= this.insetY;
        this.adjacency[x][y] |= 0x200000;
    }

    // @TODO consolodate with markBlocked via boolean param
    public unmarkBlocked(x: number, y: number): void {
        x -= this.insetX;
        y -= this.insetY;
        this.adjacency[x][y] &= 0xdfffff;
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
            const offsetChunk: Chunk = world.chunkManager.getChunk({ x: this.chunk.position.x + offsetX, y: this.chunk.position.y + offsetY, level: this.chunk.position.level });
            offsetChunk.collisionMap.set(x, y, flag);
            outOfBounds = true;
        }

        if(!outOfBounds) {
            this.adjacency[x][y] |= flag;
        }
    }
    
    // @TODO refactor
    public unset(x: number, y: number, flag: number): void {
        let outOfBounds = false;
        const currentPosition: Position = this.chunk.position;

        if(x < 0) {
            const previousXChunk: Chunk = world.chunkManager.getChunk({ x: currentPosition.x - 1, y: currentPosition.y, level: currentPosition.level });
            previousXChunk.collisionMap.unset(7, y, flag);
            outOfBounds = true;
        } else if(x > 7) {
            const nextXChunk: Chunk = world.chunkManager.getChunk({ x: currentPosition.x + 1, y: currentPosition.y, level: currentPosition.level });
            nextXChunk.collisionMap.unset(0, y, flag);
            outOfBounds = true;
        }

        if(y < 0) {
            const previousZChunk: Chunk = world.chunkManager.getChunk({ x: currentPosition.x, y: currentPosition.y - 1, level: currentPosition.level });
            previousZChunk.collisionMap.unset(x, 7, flag);
            outOfBounds = true;
        } else if(y > 7) {
            const nextZChunk: Chunk = world.chunkManager.getChunk({ x: currentPosition.x, y: currentPosition.y + 1, level: currentPosition.level });
            nextZChunk.collisionMap.unset(x, 0, flag);
            outOfBounds = true;
        }

        if(!outOfBounds) {
            this.adjacency[x][y] &= 0xffffff - flag;
        }
    }
    
}
