import uuidv4 from 'uuid/v4';
import EventEmitter from 'events';

import { filestore } from '@server/game/game-server';
import { Position, directionData, QuadtreeKey, WorldInstance, activeWorld } from '@engine/world';
import { findItem, findNpc, NpcCombatAnimations, NpcDetails, NpcSpawn } from '@engine/config';
import { soundIds, animationIds } from '@engine/world/config';

import { Actor } from './actor';
import { Player } from './player';
import { SkillName } from './skills';

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

    public constructor(npcDetails: NpcDetails | number, npcSpawn: NpcSpawn, instance: WorldInstance = null) {
        super('npc');

        this.key = npcSpawn.npcKey;
        this.uuid = uuidv4();
        this.position = npcSpawn.spawnPosition.clone();
        this.initialPosition = this.position.clone();
        this.npcSpawn = npcSpawn;

        if(instance) {
            this.instance = instance;
        }

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

        this.npcEvents.on('death', this.processDeath);
    }

    public async init(): Promise<void> {
        super.init();

        activeWorld.chunkManager.getChunkForWorldPosition(this.position).addNpc(this);

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
            activeWorld.playLocationSound(deathPosition, soundIds.npc.human.maleDeath, 5);
            const npcDetails = findNpc((defender as Npc).id);

            if(!npcDetails.dropTable) {
                return;
            }

            if(assailant instanceof Player) {
                const itemDrops = calculateNpcDrops(assailant, npcDetails);
                itemDrops.forEach(drop => {
                    activeWorld.globalInstance.spawnWorldItem({ itemId: findItem(drop.itemKey).gameId, amount: drop.amount },
                        deathPosition, { owner: assailant instanceof Player ? assailant : undefined, expires: 300 });
                })
            }
        });
    }

    public withinBounds(x: number, y: number): boolean {
        return !(x > this.initialPosition.x + this.movementRadius || x < this.initialPosition.x - this.movementRadius
            || y > this.initialPosition.y + this.movementRadius || y < this.initialPosition.y - this.movementRadius);
    }

    public kill(respawn: boolean = true): void {
        this.destroy();

        activeWorld.chunkManager.getChunkForWorldPosition(this.position).removeNpc(this);
        clearInterval(this.randomMovementInterval);
        activeWorld.deregisterNpc(this);

        if(respawn) {
            activeWorld.scheduleNpcRespawn(new Npc(findNpc(this.id), this.npcSpawn));
        }
    }

    public async tick(): Promise<void> {
        super.tick();

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
        if(this.metadata.following) {
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
        activeWorld.playLocationSound(this.position, soundId, volume);
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
            activeWorld.npcTree.remove(this.quadtreeKey);
        }

        this.quadtreeKey = { x: position.x, y: position.y, actor: this };
        activeWorld.npcTree.push(this.quadtreeKey);
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

    public get instanceId(): string {
        return this.instance?.instanceId ?? null;
    }
}

/**
 * A basic attempt at handling the odds of receiving an item from an NPCs DropTable.
 *
 * This method gets the odds defined in the DropTable, and rolls a random number to see if the odds are met.
 * Also checks whether or not the drop has a quest requirement, and accounts for that.
 *
 * @param player The player receiving the drop.
 * @param npcDetails The NpcDetails of the NPC that contains the DropTable data.
 */
export function calculateNpcDrops(player: Player, npcDetails: NpcDetails): { itemKey: string, amount?: number }[] {
    const itemDrops: { itemKey: string, amount?: number }[] = [];
    const npcDropTable = npcDetails.dropTable;
    if(!npcDropTable) {
        return itemDrops;
    }

    npcDropTable.forEach(drop => {
        let meetsQuestRequirements = true;
        if(drop.questRequirement) {
            meetsQuestRequirements = (player.getQuest(drop.questRequirement.questId).progress === drop.questRequirement.stage);
        }
        drop.amount = drop.amount || 1;
        drop.amountMax = drop.amountMax || 1;

        let odds: { numerator: number, denominator: number };
        if(drop.frequency === 'always') {
            odds = { numerator: 1, denominator: 1 };
        } else {
            const dividedFrequency = drop.frequency.split('/');
            odds = { numerator: Number(dividedFrequency[0]), denominator: Number(dividedFrequency[1]) };
        }
        const randomNumber = getRandomInt(odds.denominator);
        if(randomNumber === 1 && meetsQuestRequirements) {
            const randomNumberOfItems = getRandomInt(drop.amountMax, drop.amount);
            itemDrops.push({ itemKey: drop.itemKey, amount: randomNumberOfItems })
        }
    });

    return itemDrops;
}

/**
 * Generates a random integer between a maximum and minimum value.
 * @param max The largest value to generate to.
 * @param min The smallest value to generate from.
 */

function getRandomInt(max, min = 1): number {
    return Math.floor(Math.random() * max) + min;
}
