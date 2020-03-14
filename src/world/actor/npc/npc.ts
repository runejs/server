import { Actor } from '@server/world/actor/actor';
import { NpcSpawn } from '@server/world/config/npc-spawn';
import { NpcDefinition } from '@runejs/cache-parser';
import uuidv4 from 'uuid/v4';
import { Position } from '@server/world/position';
import { world } from '@server/game-server';
import { Direction, directionData } from '@server/world/direction';
import { QuadtreeKey } from '@server/world/world';
import { ActionPlugin } from '@server/plugins/plugin';
import { basicNumberFilter } from '@server/plugins/plugin-loader';

interface NpcAnimations {
    walk: number;
    stand: number;
    turnAround: number;
    turnRight: number;
    turnLeft: number;
}

let npcInitPlugins: NpcInitPlugin[];

export type npcInitAction = (details: { npc: Npc }) => void;

export const setNpcInitPlugins = (plugins: ActionPlugin[]): void => {
    npcInitPlugins = plugins as NpcInitPlugin[];
};

export interface NpcInitPlugin extends ActionPlugin {
    // The action function to be performed.
    action: npcInitAction;
    // A single NPC ID or a list of NPC IDs that this action applies to.
    npcIds: number | number[];
}

/**
 * Represents a non-player character within the game world.
 */
export class Npc extends Actor {

    public id: number;
    public readonly uuid: string;
    private _name: string;
    private _combatLevel: number;
    private _animations: NpcAnimations;
    public readonly options: string[];
    private _movementRadius: number = 0;
    public readonly initialPosition: Position;
    private quadtreeKey: QuadtreeKey = null;
    private _exists: boolean = true;

    public constructor(npcSpawn: NpcSpawn, cacheData: NpcDefinition) {
        super();
        this.id = cacheData.id;
        this.uuid = uuidv4();
        this._name = cacheData.name;
        this._combatLevel = cacheData.combatLevel;
        this._animations = cacheData.animations as NpcAnimations;
        this.options = cacheData.options;
        this.position = new Position(npcSpawn.x, npcSpawn.y, npcSpawn.level);
        this.initialPosition = new Position(npcSpawn.x, npcSpawn.y, npcSpawn.level);

        if(npcSpawn.radius) {
            this._movementRadius = npcSpawn.radius;
        }

        if(npcSpawn.face) {
            this.faceDirection = directionData[npcSpawn.face].index;
        }
    }

    public init(): void {
        world.chunkManager.getChunkForWorldPosition(this.position).addNpc(this);
        this.initiateRandomMovement();

        new Promise(resolve => {
            npcInitPlugins
                .filter(plugin => basicNumberFilter(plugin.npcIds, this.id))
                .forEach(plugin => plugin.action({npc: this}));
            resolve();
        });
    }

    public async tick(): Promise<void> {
        return new Promise<void>(resolve => {
            this.walkingQueue.process();
            resolve();
        });
    }

    public async reset(): Promise<void> {
        return new Promise<void>(resolve => {
            this.updateFlags.reset();
            resolve();
        });
    }

    /**
     * Forces the Npc to speak the given message to the open world.
     * @param message The message for the Npc to say.
     */
    public say(message: string): void {
        this.updateFlags.addChatMessage({ message });
    }

    /**
     * Whether or not the Npc can currently move.
     */
    public canMove(): boolean {
        return this.updateFlags.faceActor === undefined && this.updateFlags.animation === undefined;
    }

    /**
     * Plays a sound at the Npc's location for all nearby players.
     * @param soundId The ID of the sound effect.
     * @param volume The volume to play the sound at.
     */
    public playSound(soundId: number, volume: number): void {
        world.playLocationSound(this.position, soundId, volume);
    }

    /**
     * Transforms the Npc visually into a different Npc.
     * @param id The id of the Npc to transform into.
     */
    public setNewId(id: number): void {
        this.id = id;
        this.updateFlags.appearanceUpdateRequired = true;
    }

    public equals(other: Npc): boolean {
        if(!other) {
            return false;
        }

        return other.id === this.id && other.uuid === this.uuid;
    }

    public set position(position: Position) {
        super.position = position;

        if(this.quadtreeKey !== null) {
            world.npcTree.remove(this.quadtreeKey);
        }

        this.quadtreeKey = {x: position.x, y: position.y, actor: this};
        world.npcTree.push(this.quadtreeKey);
    }

    public get position(): Position {
        return super.position;
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

    public get exists(): boolean {
        return this._exists;
    }

    public set exists(value: boolean) {
        this._exists = value;
    }
}
