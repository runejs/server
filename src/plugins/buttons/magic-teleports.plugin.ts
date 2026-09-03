import type { TaskExecutor } from '@engine/action/hook/task';
import type { ButtonAction, ButtonActionHook } from '@engine/action/pipe/button.action';
import { QueueableTask } from '@engine/action/pipe/task/queueable-task';
import { widgets } from '@engine/config/config-handler';
import { activeWorld } from '@engine/world';
import type { Player } from '@engine/world/actor/player/player';
import { Skill } from '@engine/world/actor/skills';
import { animationIds } from '@engine/world/config/animation-ids';
import { gfxIds } from '@engine/world/config/gfx-ids';
import { itemIds } from '@engine/world/config/item-ids';
import { soundIds } from '@engine/world/config/sound-ids';
import type { TravelLocation } from '@engine/world/config/travel-locations';
import type { Item } from '@engine/world/items/item';
import { Position } from '@engine/world/position';
import { openHouse } from '@plugins/skills/construction/house';
import { serverConfig } from '@server/game/game-server';

enum Teleports {
    Home = 591,
    House = 581,
    Varrock = 12,
    Lumbridge = 15,
    Falador = 18,
    Camelot = 22,
    Ardougne = 388,
    Watchtower = 389,
    Trollheim = 492,
    Ape_atoll = 569,
}

/**
 * Keeps track of the cost of performing basic teleport spells.
 *
 * As of 2024-09-02 the magic system isn't fully implemented, so there isn't
 * really a centralized location for storing and processing spell costs.
 * Defining it here is the alternative.
 *
 * If needed, it can be exported, but it's not exported in order to keep this
 * plugin self-contained.
 */
const MagicCosts: Record<number, MagicCost> = {
    [Teleports.Varrock]: {
        [itemIds.runes.air]: 3,
        [itemIds.runes.law]: 1,
        [itemIds.runes.fire]: 1,
    },
    [Teleports.Lumbridge]: {
        [itemIds.runes.air]: 3,
        [itemIds.runes.law]: 1,
        [itemIds.runes.earth]: 1,
    },
    [Teleports.Falador]: {
        [itemIds.runes.air]: 3,
        [itemIds.runes.law]: 1,
        [itemIds.runes.water]: 1,
    },
    [Teleports.House]: {
        [itemIds.runes.air]: 1,
        [itemIds.runes.law]: 1,
        [itemIds.runes.earth]: 1,
    },
    [Teleports.Camelot]: {
        [itemIds.runes.air]: 5,
        [itemIds.runes.law]: 1,
    },
    [Teleports.Ardougne]: {
        [itemIds.runes.water]: 2,
        [itemIds.runes.law]: 2,
    },
    [Teleports.Watchtower]: {
        [itemIds.runes.law]: 2,
        [itemIds.runes.earth]: 2,
    },
    [Teleports.Trollheim]: {
        [itemIds.runes.law]: 2,
        [itemIds.runes.fire]: 2,
    },
    [Teleports.Ape_atoll]: {
        [itemIds.runes.fire]: 2,
        [itemIds.runes.law]: 2,
        [itemIds.runes.water]: 2,
        [itemIds.banana]: 1,
    },
};

/**
 * Mapping of the various teleport locations. Some are usable directly from
 * the `activeWorld.travelLocations` lookups, but others are not.
 */
const TeleportLocations: Record<number, Position> = {
    [Teleports.Home]: new Position(3218, 3218),
    [Teleports.Varrock]: new Position(3212, 3424),
    [Teleports.Lumbridge]: new Position(3224, 3218),
    [Teleports.Falador]: new Position(2965, 3380),
    [Teleports.Camelot]: new Position(2757, 3478),
    [Teleports.Ardougne]: new Position(2662, 3307),
    [Teleports.Watchtower]: new Position(2934, 4714, 2),
    [Teleports.Trollheim]: (activeWorld.travelLocations.find('Trollheim') as TravelLocation).position,
    [Teleports.Ape_atoll]: new Position(2798, 2798, 1),
};

const TeleportXP: Record<number, number> = {
    [Teleports.Varrock]: 35,
    [Teleports.Lumbridge]: 41,
    [Teleports.Falador]: 48,
    [Teleports.House]: 30,
    [Teleports.Camelot]: 55.5,
    [Teleports.Ardougne]: 61,
    [Teleports.Watchtower]: 68,
    [Teleports.Trollheim]: 68,
    [Teleports.Ape_atoll]: 74,
};

const buttonIds: number[] = [
    Teleports.Home,
    Teleports.Varrock,
    Teleports.Lumbridge,
    Teleports.Falador,
    Teleports.House,
    Teleports.Camelot,
    Teleports.Ardougne,
    Teleports.Watchtower,
    Teleports.Trollheim,
    Teleports.Ape_atoll,
];

function queueTeleport(player: Player, pos: Position) {
    player.enqueueBaseTask(
        new QueueableTask(
            [],
            player,
            () => {
                player.teleport(pos);
                player.metadata.castingStationarySpell = false;
                return {
                    callbackResult: false,
                    shouldContinueLooping: false,
                };
            },
            null,
            null,
        ),
    );
}

/**
 * Casts the home teleport spell (not their player owned home).
 *
 * @param elapsedTicks A counter of the number of elapsed ticks since the
 * teleport started. Used to increment through the teleporting animation up
 * until the actual teleport occurs.
 * @returns `true` once the teleport finishes, `false` until it finishes
 */
function homeTeleport(player: Player, elapsedTicks: number): boolean {
    if (elapsedTicks === 0) {
        player.playAnimation(animationIds.homeTeleportDraw);
        player.playGraphics({ id: gfxIds.homeTeleportDraw, delay: 0, height: 0 });
        player.outgoingPackets.playSound(soundIds.homeTeleportDraw, 10);
    } else if (elapsedTicks === 7) {
        player.playAnimation(animationIds.homeTeleportSit);
        player.playGraphics({ id: gfxIds.homeTeleportFullDrawnCircle, delay: 0, height: 0 });
        player.outgoingPackets.playSound(soundIds.homeTeleportSit, 10);
    } else if (elapsedTicks === 12) {
        player.playAnimation(animationIds.homeTeleportPullOutAndReadBook);
        player.playGraphics({ id: gfxIds.homeTeleportPullOutBook, delay: 0, height: 0 });
        player.outgoingPackets.playSound(soundIds.homeTeleportPullOutBook, 10);
    } else if (elapsedTicks === 16) {
        player.playAnimation(animationIds.homeTeleportReadBookAndGlowCircle);
        player.playGraphics({ id: gfxIds.homeTeleportCircleGlow, delay: 0, height: 0 });
        player.outgoingPackets.playSound(soundIds.homeTeleportCircleGlowAndTeleport, 10);
    } else if (elapsedTicks === 20) {
        player.playAnimation(animationIds.homeTeleport);
        player.playGraphics({ id: gfxIds.homeTeleport, delay: 0, height: 0 });
    } else if (elapsedTicks === 22) {
        queueTeleport(player, TeleportLocations[Teleports.Home]);
        return true;
    }

    return false;
}

type MagicCost = Record<number, number>;

/**
 * Determines if the player currently has infinite quantities of a resource,
 * such as a fire staff for fire runes.
 *
 * @param resource The item ID for the resource, such as a fire rune.
 */
function hasInfinite(player: Player, resource: number): boolean {
    switch (resource) {
        case itemIds.runes.air: {
            if (player.equipment.has(itemIds.staffs.air)) {
                return true;
            }
            break;
        }
        case itemIds.runes.fire: {
            if (player.equipment.has(itemIds.staffs.fire)) {
                return true;
            }
            break;
        }
        case itemIds.runes.water: {
            if (player.equipment.has(itemIds.staffs.water)) {
                return true;
            }
            break;
        }
        case itemIds.runes.earth: {
            if (player.equipment.has(itemIds.staffs.earth)) {
                return true;
            }
            break;
        }
    }

    return false;
}

/**
 * Deducts the cost of the spell from the player's inventory.
 *
 * @returns `false` if the player lacks the required runes
 */
function expenseMagic(player: Player, cost: MagicCost): boolean {
    if (!cost) return true;

    const indexesToUpdate: number[] = [];
    const itemsToUpdate: Record<number, Item> = [];

    for (const requiredItemId in cost) {
        const itemId: number = Number(requiredItemId);
        if (hasInfinite(player, itemId)) {
            continue;
        }

        const itemIndex: number = player.inventory.findIndex(itemId);
        if (itemIndex < 0) {
            return false;
        }

        const newItem: Item = {
            amount: player.inventory.amount(itemId) - cost[requiredItemId],
            itemId: itemId,
        };

        if (newItem.amount < 0) {
            return false;
        }

        itemsToUpdate[itemIndex] = newItem;
        indexesToUpdate.push(itemIndex);
    }

    for (let i = 0; i < indexesToUpdate.length; i++) {
        if (itemsToUpdate[indexesToUpdate[i]].amount === 0) {
            player.inventory.remove(indexesToUpdate[i]);
        } else {
            player.inventory.set(indexesToUpdate[i], itemsToUpdate[indexesToUpdate[i]]);
        }
    }

    return true;
}

function genericTeleport(player: Player, elapsedTicks: number, target: Position, teleportId?: number): boolean {
    if (elapsedTicks === 0) {
        player.playAnimation(animationIds.teleport);
        player.outgoingPackets.playSound(soundIds.teleport, 10);
        player.playGraphics({ id: gfxIds.teleport, delay: 0, height: 100 });
    } else if (elapsedTicks === 3) {
        switch (teleportId) {
            case Teleports.House: {
                openHouse(player);
                break;
            }
            default: {
                queueTeleport(player, target);

                // warning: undefined xp values cause the xp to reset to 0,
                // so make sure to always assert that it's defined
                if (teleportId && TeleportXP[teleportId]) {
                    player.enqueueBaseTask(
                        new QueueableTask(
                            [],
                            player,
                            () => {
                                player.skills.addExp(Skill.MAGIC, TeleportXP[teleportId]);
                                return { callbackResult: false, shouldContinueLooping: false };
                            },
                            null,
                            null,
                        ),
                    );
                }
                break;
            }
        }
        player.playAnimation(animationIds.reset);
        return true;
    }

    return false;
}

const insufficient = 'You do not have enough runes to cast this spell.';

const activate = (task: TaskExecutor<ButtonAction>, elapsedTicks: number = 0) => {
    const { player, buttonId } = task.actionData;

    let completed: boolean = false;

    switch (buttonId) {
        case Teleports.Home:
            completed = homeTeleport(player, elapsedTicks);
            break;
        case Teleports.Varrock:
        case Teleports.Lumbridge:
        case Teleports.Falador:
        case Teleports.House:
        case Teleports.Camelot:
        case Teleports.Ardougne:
        case Teleports.Watchtower:
        case Teleports.Trollheim:
        case Teleports.Ape_atoll: {
            if (elapsedTicks === 0) {
                // prevents the player from spamming the spell
                if (player.metadata?.castingStationarySpell) {
                    player.sendMessage('You are already teleporting.');
                    task.stop();
                    return;
                }

                player.metadata.castingStationarySpell = true;

                if (!serverConfig.bypassTeleportRequirements && !expenseMagic(player, MagicCosts[buttonId])) {
                    player.sendMessage(insufficient);
                    completed = true;
                    break;
                }

                player.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, player.inventory);
            }

            completed = genericTeleport(player, elapsedTicks, TeleportLocations[buttonId], buttonId);

            break;
        }
    }

    if (completed) {
        player.metadata.castingStationarySpell = false;
        task.stop();
    }
};

export default {
    pluginId: 'rs:magic_teleports',
    hooks: [
        {
            type: 'button',
            widgetId: 192,
            buttonIds: buttonIds,
            task: {
                activate,
                interval: 1,
            },
        } as ButtonActionHook,
    ],
};
