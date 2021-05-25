import { Actor } from '@engine/world/actor/actor';
import uuidv4 from 'uuid/v4';
import { Position } from '@engine/world/position';
import { filestore, world } from '@engine/game-server';
import { directionData } from '@engine/world/direction';
import { QuadtreeKey } from '@engine/world';
import { findNpc } from '@engine/config';
import { animationIds } from '@engine/world/config/animation-ids';
import { NpcCombatAnimations, NpcDetails } from '@engine/config/npc-config';
import { SkillName } from '@engine/world/actor/skills';
import { NpcSpawn } from '@engine/config/npc-spawn-config';
import { MeleeCombatBehavior } from '../behaviors/melee-combat.behavior';
import { forEach } from 'lodash';
import { Behavior } from '../behaviors/behavior';
import EventEmitter from 'events';
import { soundIds } from '../../config/sound-ids';
import { Player } from '../player/player';
import { itemIds } from '../../config/item-ids';
import { logger } from '@runejs/core';


/**
 * Represents a non-player character within the game world.
 */
export class Npc extends Actor {
    public readonly uuid: string;
    public readonly options: string[];
    public readonly initialPosition: Position;
    public readonly key: string;
    public readonly varbitId: number = -1;
    public readonly settingId: number = -1;
    public readonly childrenIds?: number[];
    public parent?: Npc;
    public id: number;
    public animations: NpcCombatAnimations & {
        walk?: number;
        turnAround?: number;
        turnLeft?: number;
        turnRight?: number;
        stand?: number;
    };
    public instanceId: string = null;
    //ToDo: this should either be calculated by the level or from a config
    public experienceValue: number = 10;
    public npcEvents: EventEmitter = new EventEmitter();


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
            this.animations = npcDetails.combatAnimations;
            this.options = npcDetails.options;

            if(npcDetails.skills) {
                const skillNames = Object.keys(npcDetails.skills);
                skillNames.forEach(skillName => this.skills.setLevel(skillName as SkillName, npcDetails.skills[skillName]));
            }
        }

        const cacheDetails = filestore.configStore.npcStore.getNpc(this.id);
        if(cacheDetails) {
            // NPC not registered on the server, but exists in the game cache - use that for our info and assume it's
            // Not a combatant NPC since we have no useful combat information for it.
            this._name = cacheDetails.name;
            this._combatLevel = cacheDetails.combatLevel;
            this.options = cacheDetails.options;
            this.varbitId = cacheDetails.varbitId;
            this.settingId = cacheDetails.settingId;
            this.childrenIds = cacheDetails.childrenIds;
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
        // ToDo: this should be config based and not always melee (obviously)
        this.Behaviors.push(new MeleeCombatBehavior());
        this.npcEvents.on('death', this.processDeath);
    }

    public async init(): Promise<void> {
        world.chunkManager.getChunkForWorldPosition(this.position).addNpc(this);

        if(this.movementRadius > 0) {
            this.initiateRandomMovement();
        }

        await this.actionPipeline.call('npc_init', { npc: this });

        this._initialized = true;
    }

    //This is useful so that we can tie into things like "spell casts" or events, or traps, etc to finish quests or whatever

    public async processDeath(assailant: Actor, defender:Actor): Promise<void> {
        
        return new Promise<void>(resolve => {
            const deathPosition = defender.position;

            let deathAnim: number = animationIds.death;
            deathAnim = findNpc((defender as Npc).id)?.combatAnimations?.death || animationIds.death

            defender.playAnimation(deathAnim);
            world.playLocationSound(deathPosition, soundIds.npc.human.maleDeath, 5);
            world.globalInstance.spawnWorldItem(itemIds.bones, deathPosition, { owner: assailant instanceof Player ? assailant : undefined, expires: 300 });

        });

    }
    public getAttackAnimation(): number {
        let attackAnim = findNpc(this.id)?.combatAnimations?.attack || animationIds.combat.punch;
        if(Array.isArray(attackAnim)) {
            // NPC has multiple attack animations possible, pick a random one from the list to use
            const idx = Math.floor(Math.random() * attackAnim.length);
            attackAnim = attackAnim[idx];
        }

        return attackAnim;
    }

    public getBlockAnimation(): number {
        return findNpc(this.id)?.combatAnimations?.defend || animationIds.combat.armBlock;
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
        for (let i = 0; i < this.Behaviors.length; i++) {
            this.Behaviors[i].tick();
        }
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
