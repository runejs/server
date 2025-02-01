import EventEmitter from 'events';
import { findItem, findNpc } from '@engine/config/config-handler';
import type { DropTable, NpcCombatAnimations, NpcDetails } from '@engine/config/npc-config';
import type { NpcSpawn } from '@engine/config/npc-spawn-config';
import { activeWorld } from '@engine/world';
import type { Player } from '@engine/world/actor/player/player';
import { DamageType } from '@engine/world/actor/update-flags';
import { isPlayer } from '@engine/world/actor/util';
import { animationIds } from '@engine/world/config/animation-ids';
import { soundIds } from '@engine/world/config/sound-ids';
import { directionData } from '@engine/world/direction';
import type { WorldInstance } from '@engine/world/instances';
import type { Position } from '@engine/world/position';
import type { QuadtreeKey } from '@engine/world/world';
import { logger } from '@runejs/common';
import { filestore } from '@server/game/game-server';
import { v4 } from 'uuid';
import { Actor } from './actor';
import type { SkillName } from './skills';
import { TargetLock } from './combat';

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

    public readonly cacheDetails: NpcDetails;
    public parent?: Npc;
    public id: number;
    public animations: NpcCombatAnimations & {
        walk?: number;
        turnAround?: number;
        turnLeft?: number;
        turnRight?: number;
        stand?: number;
    };
    public npcEvents: EventEmitter = new EventEmitter();

    private _name: string;
    private _combatLevel: number;
    private _movementRadius: number = 0;
    private quadtreeKey: QuadtreeKey | null = null;
    private _exists: boolean = true;
    private npcSpawn: NpcSpawn;
    private _initialized: boolean = false;
    /**
     * Set when an NPC's health reaches zero - when true - indicates that the NPC will be
     * destroyed on the next tick.
     */
    private isDying: boolean = false;
    /** Stores a record of hit damage and the player to later determine drops. */
    private playerHits: [username: string, damage: number][] = [];
    /**
     * Tracks the actor, if any, which most recently hit the NPC.
     *
     * Each tick, if {@link attackingActor} is not set - we will attempt to path
     * towards this Actor to attack them when in range.
     */
    private underAttackBy?: Actor;
    /** State for any attack which is in progress. */
    private attackInProgress?: {
        combatTick: number;
        targetLock: TargetLock;
        victim: Actor;
    };

    /** Starts incrementing once the NPC's health reaches 0. */
    private deathTick = 0;

    public constructor(npcDetails: NpcDetails | number, npcSpawn: NpcSpawn, instance: WorldInstance | null = null) {
        super('npc');

        this.key = npcSpawn.npcKey;
        this.uuid = v4();
        this.position = npcSpawn.spawnPosition.clone();
        this.initialPosition = this.position.clone();
        this.npcSpawn = npcSpawn;

        if (instance) {
            this.instance = instance;
        }

        if (npcSpawn.movementRadius) {
            this._movementRadius = npcSpawn.movementRadius;
        }

        if (npcSpawn.faceDirection) {
            this.faceDirection = directionData[npcSpawn.faceDirection].index;
        }

        if (typeof npcDetails === 'number') {
            this.id = npcDetails;
            this.cacheDetails = findNpc(npcDetails);
        } else {
            this.id = npcDetails.gameId;
            this._combatLevel = npcDetails.combatLevel;
            this.animations = npcDetails.combatAnimations || {};
            this.options = npcDetails.options || [];
            this.cacheDetails = npcDetails;

            if (npcDetails.skills) {
                const skillNames = Object.keys(npcDetails.skills);
                skillNames.forEach(skillName => this.skills.setLevel(skillName as SkillName, npcDetails.skills?.[skillName] ?? 1));
            }
        }

        const cacheDetails = filestore.configStore.npcStore.getNpc(this.id);
        if (cacheDetails) {
            // NPC not registered on the server, but exists in the game cache - use that for our info and assume it's
            // Not a combatant NPC since we have no useful combat information for it.

            this._name = cacheDetails.name || '';
            this._combatLevel = cacheDetails.combatLevel;
            this.options = cacheDetails.options || [];
            this.varbitId = cacheDetails.varbitId;
            this.settingId = cacheDetails.settingId;
            this.childrenIds = cacheDetails.childrenIds;
            this.animations = {
                walk: cacheDetails.animations?.walk || undefined,
                turnAround: cacheDetails.animations?.turnAround || undefined,
                turnLeft: cacheDetails.animations?.turnLeft || undefined,
                turnRight: cacheDetails.animations?.turnRight || undefined,
                stand: cacheDetails.animations?.stand || undefined,
            };
        } else {
            this._name = 'Unknown';
        }

        this.npcEvents.on('death', this.processDeath);
    }

    public async init(): Promise<void> {
        super.init();

        activeWorld.chunkManager.getChunkForWorldPosition(this.position).addNpc(this);

        if (this.movementRadius > 0) {
            this.initiateRandomMovement();
        }

        await this.actionPipeline.call('npc_init', { npc: this });

        this._initialized = true;
    }

    public hit(targetLock: TargetLock, attacker: Actor, damage: number) {
        if (!this.targetLock || !targetLock.isValid() || this.targetLock.lockId !== targetLock.lockId) {
            throw new Error('A targetLock from maybeGetTargetLock must be provided before hitting this actor.');
        }

        // Set the attacker as the most recent actor to attack this NPC.
        this.underAttackBy = attacker;

        const currentHitpoints = this.skills.hitpoints.level;
        let nextHitpoints = currentHitpoints - damage;
        nextHitpoints = nextHitpoints > 0 ? nextHitpoints : 0;
        const finalDamage = nextHitpoints > 0 ? damage : currentHitpoints;

        if (finalDamage === 0) {
            this.updateFlags.addDamage(0, DamageType.NO_DAMAGE, currentHitpoints, this.cacheDetails.skills?.hitpoints || 10);
        } else {
            this.skills.setHitpoints(nextHitpoints);
            this.updateFlags.addDamage(finalDamage, DamageType.DAMAGE, nextHitpoints, this.cacheDetails.skills?.hitpoints || 10);

            if (isPlayer(attacker)) {
                this.playerHits.push([attacker.username, finalDamage]);
            }
        }
    }

    private processDeath() {
        // Play the custom death animation if found otherwise use the default.
        this.playAnimation(this.cacheDetails.combatAnimations?.death || animationIds.death);

        // Play the sound of death
        // TODO: Replace with NPC specific death sound.
        this.playSound(soundIds.npc.human.maleDeath, 5);

        // Drop handling - drops are awarded to the player-type damage source
        // which contributed the most damage to the NPC.

        if (!this.cacheDetails.dropTable) {
            // Short circuit if this NPC doesn't drop anything.
            return;
        }

        if (this.playerHits.length === 0) {
            // We were killed by something other than a player(s)... mysterious.
            return;
        }

        // Determine which player did the most damage.
        const countMap: { [username: string]: number } = {};
        let maxCount = 0;
        let maxUsername = this.playerHits[0][0];

        this.playerHits.forEach(([username, count]) => {
            countMap[username] = (countMap[username] || 0) + count;
            if (countMap[username] > maxCount) {
                maxCount = countMap[username];
                maxUsername = username;
            }
        });

        const dropOwner = activeWorld.findActivePlayerByUsername(maxUsername);

        if (!dropOwner) {
            logger.warn('NPC drops skipped as receiving player was not found.');
            return;
        }

        const deathPosition = this.position;
        const itemDrops = calculateNpcDropsForPlayer(this.cacheDetails.dropTable, dropOwner);

        itemDrops.forEach(drop => {
            const droppedItem = findItem(drop.itemKey);

            if (!droppedItem) {
                logger.error(`Unable to find item with key: ${drop.itemKey}`);
                return;
            }

            if (!drop.amount) {
                logger.error(`Unable to drop item with key: ${drop.itemKey} - no amount specified`);
                return;
            }

            activeWorld.globalInstance.spawnWorldItem({ itemId: droppedItem.gameId, amount: drop.amount }, deathPosition, {
                owner: dropOwner,
                expires: 300,
            });
        });
    }

    private kill(respawn: boolean = true): void {
        this.destroy();

        activeWorld.chunkManager.getChunkForWorldPosition(this.position).removeNpc(this);
        clearInterval(this.randomMovementInterval);
        activeWorld.deregisterNpc(this);

        if (respawn) {
            activeWorld.scheduleNpcRespawn(new Npc(this.cacheDetails, this.npcSpawn));
        }
    }

    public withinBounds(x: number, y: number): boolean {
        return !(
            x > this.initialPosition.x + this.movementRadius ||
            x < this.initialPosition.x - this.movementRadius ||
            y > this.initialPosition.y + this.movementRadius ||
            y < this.initialPosition.y - this.movementRadius
        );
    }

    public async tick(): Promise<void> {
        super.tick();

        return new Promise<void>(resolve => {
            // Check if we are dead.
            if (this.skills.hitpoints.level <= 0) {
                // Skip a tick so that the death animation doesn't conflict with the last attack.
                if (this.deathTick === 1) {
                    this.processDeath();
                }

                if (this.deathTick >= 3) {
                    this.kill();
                }

                this.deathTick++;
                // We are dead and shouldn't bother doing anything else.
                return resolve();
            }

            this.walkingQueue.process();
            return resolve();
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
        if (!super.canMove()) {
            return false;
        }
        if (this.metadata.following) {
            return false;
        }
        return this.updateFlags.faceActor === null && this.updateFlags.animation === null;
    }

    /**
     * Plays a sound at the Npc's location for all nearby players.
     * @param soundId The ID of the sound effect.
     * @param volume The volume to play the sound at.
     */
    public playSound(soundId: number, volume: number): void {
        activeWorld.playLocationSound(this.position, this.instance.instanceId, soundId, volume);
    }

    /**
     * Transforms the Npc visually into a different Npc.
     * @param npcKey The unique string key of the Npc to transform into.
     */
    public transformInto(npcKey: string): void {
        const npcDetails = findNpc(npcKey);
        this.id = npcDetails.gameId;
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
        if (!other) {
            return false;
        }

        return other.id === this.id && other.uuid === this.uuid;
    }

    public set position(position: Position) {
        super.position = position;

        if (this.quadtreeKey !== null) {
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

    public get instanceId(): string | null {
        return this.instance?.instanceId ?? null;
    }
}

/**
 * A basic attempt at handling the odds of receiving an item from an NPCs DropTable.
 *
 * This method gets the odds defined in the DropTable, and rolls a random number to see if the odds are met.
 * Also checks whether or not the player has met any quest requirements for the drop.
 *
 * @param player The player receiving the drop.
 * @param npcDetails The NpcDetails of the NPC that contains the DropTable data.
 */
export function calculateNpcDropsForPlayer(npcDropTable: DropTable[], player: Player): { itemKey: string; amount?: number }[] {
    const itemDrops: { itemKey: string; amount?: number }[] = [];

    npcDropTable.forEach(drop => {
        let meetsQuestRequirements = true;
        if (drop.questRequirement) {
            meetsQuestRequirements = player.getQuest(drop.questRequirement.questId).progress === drop.questRequirement.stage;
        }
        drop.amount = drop.amount || 1;
        drop.amountMax = drop.amountMax || 1;

        let odds: { numerator: number; denominator: number };
        if (drop.frequency === 'always') {
            odds = { numerator: 1, denominator: 1 };
        } else {
            const dividedFrequency = drop.frequency.split('/');
            odds = { numerator: Number(dividedFrequency[0]), denominator: Number(dividedFrequency[1]) };
        }
        const randomNumber = getRandomInt(odds.denominator);
        if (randomNumber === 1 && meetsQuestRequirements) {
            const randomNumberOfItems = getRandomInt(drop.amountMax, drop.amount);
            itemDrops.push({ itemKey: drop.itemKey, amount: randomNumberOfItems });
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
