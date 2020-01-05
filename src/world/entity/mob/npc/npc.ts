import { Mob } from '../mob';
import { NpcSpawn } from '../../../config/npc-spawn';
import { NpcDefinition } from '@runejs/cache-parser';
import uuidv4 from 'uuid/v4';
import { Position } from '../../../position';
import { Direction } from '../../../world';
import { world } from '../../../../game-server';

interface NpcAnimations {
    walk: number;
    stand: number;
    turnAround: number;
    turnRight: number;
    turnLeft: number;
}

/**
 * Represents a non-player character within the game world.
 */
export class Npc extends Mob {

    public readonly id: number;
    public readonly uuid: string;
    private _name: string;
    private _combatLevel: number;
    private _animations: NpcAnimations;
    private _movementRadius: number = 0;
    private _initialFaceDirection: Direction = 'NORTH';

    public constructor(npcSpawn: NpcSpawn, cacheData: NpcDefinition) {
        super();
        this.id = cacheData.id;
        this.uuid = uuidv4();
        this._name = cacheData.name;
        this._combatLevel = cacheData.combatLevel;
        this._animations = cacheData.animations as NpcAnimations;
        this.position = new Position(npcSpawn.x, npcSpawn.y, npcSpawn.level);

        if(npcSpawn.radius) {
            this._movementRadius = npcSpawn.radius;
        }

        if(npcSpawn.face) {
            this._initialFaceDirection = npcSpawn.face;
        }
    }

    public init(): void {
        world.chunkManager.getChunkForWorldPosition(this.position).addNpc(this);
    }

    public reset(): Promise<void> {
        return new Promise<void>(resolve => {
            this.updateFlags.reset();
            resolve();
        });
    }

    public equals(other: Npc): boolean {
        if(!other) {
            return false;
        }

        return other.id === this.id && other.uuid === this.uuid;
    }

    public get name(): string {
        return this._name;
    }

    public get combatLevel(): number {
        return this._combatLevel;
    }

    public get animations(): NpcAnimations {
        return this._animations;
    }

    public get movementRadius(): number {
        return this._movementRadius;
    }

    public get initialFaceDirection(): Direction {
        return this._initialFaceDirection;
    }
}
