import { v4 } from 'uuid';
import EventEmitter from 'node:events';

import { filestore } from '@server/game/game-server';
import {
    Position,
    directionData,
    QuadtreeKey,
    WorldInstance,
    activeWorld,
} from '@engine/world';
import {
    DropTable,
    findItem,
    findNpc,
    NpcCombatAnimations,
    NpcDetails,
    NpcSpawn,
} from '@engine/config';
import { soundIds, animationIds } from '@engine/world/config';

import { Actor } from './actor';
import { Player } from './player';
import { SkillName } from './skills';
import { logger } from '@runejs/common';
import { getTargetLock, TargetLock } from './combat';
import { DamageType } from './update-flags';

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
    public npcEvents: EventEmitter = new EventEmitter();

    private _name: string;
    private _combatLevel: number;
    private _movementRadius: number = 0;
    private quadtreeKey: QuadtreeKey | null = null;
    private _exists: boolean = true;
    private npcSpawn: NpcSpawn;
    private _initialized: boolean = false;

    public constructor(
        npcDetails: NpcDetails | number,
        npcSpawn: NpcSpawn,
        instance: WorldInstance | null = null,
    ) {
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
        } else {
            this.id = npcDetails.gameId;
            this._combatLevel = npcDetails.combatLevel;
            this.animations = npcDetails.combatAnimations || {};
            this.options = npcDetails.options || [];

            if (npcDetails.skills) {
                const skillNames = Object.keys(npcDetails.skills);
                skillNames.forEach((skillName) =>
                    this.skills.setLevel(
                        skillName as SkillName,
                        npcDetails.skills?.[skillName] ?? 1,
                    ),
                );
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

        activeWorld.chunkManager
            .getChunkForWorldPosition(this.position)
            .addNpc(this);

        if (this.movementRadius > 0) {
            this.initiateRandomMovement();
        }

        await this.actionPipeline.call('npc_init', { npc: this });

        this._initialized = true;
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

        return new Promise<void>((resolve) => {
            // Check if we are dead.
            if (this.skills.hitpoints.level === 0) {
                // We separate calls to kill and processDeath by a tick to allow
                // the death animation to play out.
                if (this.isDying) {
                    this.kill();
                } else {
                    this.processDeath();
                    this.isDying = true;
                }

                // We are dead and shouldn't bother doing anything else.
                return resolve();
            }

            if (this.underAttackBy) {
                const victim = this.underAttackBy;

                // Don't keep beating a dead horse.
                if (victim.skills.hitpoints.level === 0) {
                    this.clearFaceActor();
                    this.initiateRandomMovement();
                    this.underAttackBy = undefined;
                    // Make sure we aren't already attacking.
                } else if (!this.attackInProgress) {
                    if (this.position.distanceBetween(victim.position) <= 2) {
                        const targetLock = victim.maybeGetTargetLock(3000);
                        // Cleared for lift-off
                        if (targetLock) {
                            this.attackInProgress = {
                                combatTick: 0,
                                targetLock,
                                victim,
                            };
                        }
                    } else {
                        this.moveTo(victim);
                        // TODO: Retreat
                    }
                }

                // Continue
            }

            if (this.attackInProgress) {
                this.attackInProgress.combatTick++;
                const { combatTick, targetLock, victim } =
                    this.attackInProgress;
                // if(victim.skills.hitpoints.level === 0) {
                //
                // }
                switch (combatTick) {
                    // 0 is absorbed by increment above.
                    case 1:
                        this.face(victim, true);

                        this.playAnimation({
                            id: 309,
                            delay: 20,
                        });
                        break;
                    case 2:
                        break;
                    // biome-ignore lint/suspicious/noFallthroughSwitchClause: Deliberate fall-through
                    case 3: {
                        // Calculate hit and apply damage.
                        const hit = Math.round(Math.random() * 2);
                        victim.hit(targetLock, this, hit);
                    }
                    default:
                        this.attackInProgress = undefined;
                        // This is to attempt to ensure we keep attacking
                        // the same person in multi-combat scenarios.
                        this.underAttackBy = victim;
                        break;
                }
            }

            this.walkingQueue.process();

            return resolve();
        });
    }

    public async reset(): Promise<void> {
        return new Promise<void>((resolve) => {
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
        if (this.metadata.following) {
            return false;
        }
        return (
            this.updateFlags.faceActor === null &&
            this.updateFlags.animation === null
        );
    }

    /**
     * Plays a sound at the Npc's location for all nearby players.
     * @param soundId The ID of the sound effect.
     * @param volume The volume to play the sound at.
     */
    public playSound(soundId: number, volume: number): void {
        activeWorld.playLocationSound(
            this.position,
            this.instance.instanceId,
            soundId,
            volume,
        );
    }

    /**
     * Transforms the Npc visually into a different Npc.
     * @param npcKey The unique string key of the Npc to transform into.
     */
    public transformInto(npcKey: string): void {
        const npcDetails = findNpc(npcKey);

        if (!npcDetails) {
            logger.error(
                `Unable to find npc with key: ${npcKey} for transformation.`,
            );
            return;
        }

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

    // COMBAT STUFF
    // TODO: Move generic stuff up to Actor or create a new "Combatant" type of Actor or
    // whatever Object-Oriented thingy people like.

    /**
     * Set when an NPC's health reaches zero - when true - indicates that the NPC will be
     * destroyed on the next tick.
     */
    private isDying: boolean = false;

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

    /** Stores a record of hit damage and the player to later determine drops. */
    private playerHits: [username: string, damage: number][] = [];
    public hit(targetLock: TargetLock, attacker: Actor, damage: number) {
        if (
            !this.targetLock ||
            !targetLock.isValid() ||
            this.targetLock.lockId !== targetLock.lockId
        ) {
            throw new Error(
                'A targetLock from maybeGetTargetLock must be provided before hitting this actor.',
            );
        }

        this.underAttackBy = attacker;

        const currentHitpoints = this.skills.hitpoints.level;
        let nextHitpoints = currentHitpoints - damage;
        nextHitpoints = nextHitpoints > 0 ? nextHitpoints : 0;
        const finalDamage = nextHitpoints > 0 ? damage : currentHitpoints;

        if (finalDamage === 0) {
            this.updateFlags.addDamage(
                0,
                DamageType.NO_DAMAGE,
                currentHitpoints,
                5, // TODO: Hardcoded to Goblin max health - NPC max health is not available.
            );
        } else {
            this.skills.setHitpoints(nextHitpoints);
            this.updateFlags.addDamage(
                finalDamage,
                DamageType.DAMAGE,
                nextHitpoints,
                5, // TODO: Hardcoded to Goblin max health - NPC max health is not available.
            );

            if (attacker.isPlayer()) {
                this.playerHits.push([attacker.username, finalDamage]);
            }
        }
    }

    // TODO: This should be part of the Actor abstraction (players can die too yo!)
    private processDeath() {
        // TODO: Why aren't the npcDetails accesible via `this`?
        const npcDetails = findNpc(this.id);
        if (npcDetails == null) {
            throw new Error(
                `Unable to find details for NPC with ID: ${this.id}`,
            );
        }

        // Play the custom death animation if found otherwise use the default.
        this.playAnimation(
            npcDetails.combatAnimations?.death || animationIds.death,
        );

        // Play the sound of death
        // TODO: Replace with NPC specific death sound.
        this.playSound(soundIds.npc.human.maleDeath, 5);

        // Drop handling - drops are awarded to the player-type damage source
        // which contributed the most damage to the NPC.

        if (!npcDetails.dropTable) {
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
        const itemDrops = calculateNpcDropsForPlayer(
            npcDetails.dropTable,
            dropOwner,
        );

        itemDrops.forEach((drop) => {
            const droppedItem = findItem(drop.itemKey);

            if (!droppedItem) {
                logger.error(`Unable to find item with key: ${drop.itemKey}`);
                return;
            }

            if (!drop.amount) {
                logger.error(
                    `Unable to drop item with key: ${drop.itemKey} - no amount specified`,
                );
                return;
            }

            activeWorld.globalInstance.spawnWorldItem(
                { itemId: droppedItem.gameId, amount: drop.amount },
                deathPosition,
                {
                    owner: dropOwner,
                    expires: 300,
                },
            );
        });
    }

    // TODO: This should be part of the Actor abstraction (players can die too yo!)
    private kill(respawn: boolean = true): void {
        this.destroy();

        activeWorld.chunkManager
            .getChunkForWorldPosition(this.position)
            .removeNpc(this);
        clearInterval(this.randomMovementInterval);
        activeWorld.deregisterNpc(this);

        if (respawn) {
            const npcDetails = findNpc(this.id);

            if (!npcDetails) {
                return;
            }

            activeWorld.scheduleNpcRespawn(new Npc(npcDetails, this.npcSpawn));
        }
    }
}

/**
 * A basic attempt at handling the odds of receiving an item from an NPCs DropTable.
 *
 * This method gets the odds defined in the DropTable, and rolls a random number to see if the odds are met.
 * Also checks whether or not the player has met any quest requirements for the drop.
 *
 * TODO: This isn't _really_ the concern of the NPC, it's dead at this point lol.
 */
export function calculateNpcDropsForPlayer(
    npcDropTable: DropTable[],
    player: Player,
): { itemKey: string; amount?: number }[] {
    const itemDrops: { itemKey: string; amount?: number }[] = [];

    npcDropTable.forEach((drop) => {
        let meetsQuestRequirements = true;
        if (drop.questRequirement) {
            meetsQuestRequirements =
                player.getQuest(drop.questRequirement.questId).progress ===
                drop.questRequirement.stage;
        }
        drop.amount = drop.amount || 1;
        drop.amountMax = drop.amountMax || 1;

        let odds: { numerator: number; denominator: number };
        if (drop.frequency === 'always') {
            odds = { numerator: 1, denominator: 1 };
        } else {
            const dividedFrequency = drop.frequency.split('/');
            odds = {
                numerator: Number(dividedFrequency[0]),
                denominator: Number(dividedFrequency[1]),
            };
        }
        const randomNumber = getRandomInt(odds.denominator);
        if (randomNumber === 1 && meetsQuestRequirements) {
            const randomNumberOfItems = getRandomInt(
                drop.amountMax,
                drop.amount,
            );
            itemDrops.push({
                itemKey: drop.itemKey,
                amount: randomNumberOfItems,
            });
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
