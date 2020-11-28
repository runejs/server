import { Actor } from '@server/world/actor/actor';
import uuidv4 from 'uuid/v4';
import { Position } from '@server/world/position';
import { cache, pluginActions, world } from '@server/game-server';
import { directionData } from '@server/world/direction';
import { QuadtreeKey } from '@server/world';
import { basicNumberFilter } from '@server/plugins/plugin-loader';
import { Action } from '@server/world/action';
import { findNpc } from '@server/config';
import { animationIds } from '@server/world/config/animation-ids';
import { NpcAnimations, NpcDetails } from '@server/config/npc-config';
import { SkillName } from '@server/world/actor/skills';
import { NpcSpawn } from '@server/config/npc-spawn-config';

export type npcInitAction = (data: { npc: Npc }) => void;

export interface NpcInitAction extends Action {
    // The action function to be performed.
    action: npcInitAction;
    // A single NPC ID or a list of NPC IDs that this action applies to.
    npcIds: number | number[];
}

/**
 * Represents a non-player character within the game world.
 */
export class Npc extends Actor {

    public readonly uuid: string;
    public readonly options: string[];
    public readonly initialPosition: Position;
    public readonly key: string;
    public id: number;
    public animations: NpcAnimations;
    public instanceId: string = null;

    private _name: string;
    private _combatLevel: number;
    private _movementRadius: number = 0;
    private quadtreeKey: QuadtreeKey = null;
    private _exists: boolean = true;
    private npcSpawn: NpcSpawn;
    private _initialized: boolean = false;

    public constructor(npcDetails: NpcDetails | number, npcSpawn: NpcSpawn, instanceId: string = null) {
        super();

        this.key = npcSpawn.npcKey;
        this.uuid = uuidv4();
        this.position = npcSpawn.spawnPosition.clone();
        this.initialPosition = this.position.clone();
        this.npcSpawn = npcSpawn;
        this.instanceId = instanceId;

        if(npcSpawn.movementRadius) {
            this._movementRadius = npcSpawn.movementRadius;
        }

        if(npcSpawn.faceDirection) {
            this.faceDirection = directionData[npcSpawn.faceDirection].index;
        }

        if(typeof npcDetails === 'number') {
            this.id = npcDetails;
        } else {
            this.id = npcDetails.gameId;
            this._combatLevel = npcDetails.combatLevel;
            this.animations = npcDetails.animations;
            this.options = npcDetails.options;

            if(npcDetails.skills) {
                const skillNames = Object.keys(npcDetails.skills);
                skillNames.forEach(skillName => this.skills.setLevel(skillName as SkillName, npcDetails.skills[skillName]));
            }
        }

        const cacheDetails = cache.npcDefinitions.get(this.id);
        if(cacheDetails) {
            // NPC not registered on the server, but exists in the game cache - use that for our info and assume it's
            // Not a combatant NPC since we have no useful combat information for it.
            this._name = cacheDetails.name;
            this._combatLevel = cacheDetails.combatLevel;
            this.options = cacheDetails.options;
            this.animations = {
                walk: cacheDetails.animations?.walk || undefined,
                turnAround: cacheDetails.animations?.turnAround || undefined,
                turnLeft: cacheDetails.animations?.turnLeft || undefined,
                turnRight: cacheDetails.animations?.turnRight || undefined,
                stand: cacheDetails.animations?.stand || undefined
            };
        } else {
            this._name = 'Unknown';
        }
    }

    public async init(): Promise<void> {
        world.chunkManager.getChunkForWorldPosition(this.position).addNpc(this);

        if(this.movementRadius > 0) {
            this.initiateRandomMovement();
        }

        await new Promise(resolve => {
            pluginActions.npc_init
                .filter(plugin => basicNumberFilter(plugin.npcIds, this.id))
                .forEach(plugin => plugin.action({ npc: this }));
            resolve();
        });

        this._initialized = true;
    }

    public getAttackAnimation(): number {
        let attackAnim = findNpc(this.id)?.animations?.attack || animationIds.combat.punch;
        if(Array.isArray(attackAnim)) {
            // NPC has multiple attack animations possible, pick a random one from the list to use
            const idx = Math.floor(Math.random() * attackAnim.length);
            attackAnim = attackAnim[idx];
        }

        return attackAnim;
    }

    public getBlockAnimation(): number {
        return findNpc(this.id)?.animations?.defend || animationIds.combat.armBlock;
    }

    public kill(respawn: boolean = true): void {
        world.chunkManager.getChunkForWorldPosition(this.position).removeNpc(this);
        clearInterval(this.randomMovementInterval);
        world.deregisterNpc(this);

        if(respawn) {
            world.scheduleNpcRespawn(new Npc(findNpc(this.id), this.npcSpawn));
        }
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
        if(this.metadata.following || this.metadata.tailing) {
            return false;
        }
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
     * @param npcKey The unique string key of the Npc to transform into.
     */
    public transformInto(npcKey: string): void {
        this.id = findNpc(npcKey).gameId;
        this.updateFlags.appearanceUpdateRequired = true;
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

        this.quadtreeKey = { x: position.x, y: position.y, actor: this };
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

    public get movementRadius(): number {
        return this._movementRadius;
    }

    public get exists(): boolean {
        return this._exists;
    }

    public set exists(value: boolean) {
        this._exists = value;
    }

    public get initialized(): boolean {
        return this._initialized;
    }
}
