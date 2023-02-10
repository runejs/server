import { Player } from '@engine/world/actor/player/player';
import { IHarvestable } from '@engine/world/config/harvestable-object';
import { soundIds } from '@engine/world/config/sound-ids';
import { Skill } from '@engine/world/actor/skills';
import { getBestAxe, getBestPickaxe, HarvestTool, getFishingRod } from '@engine/world/config/harvest-tool';
import { randomBetween } from '@engine/util/num';
import { ObjectInteractionAction } from '@engine/action';
import { colors } from '@engine/util/colors';
import { checkForGemBoost } from '@engine/world/skill-util/glory-boost';
import { colorText } from '@engine/util/strings';
import { rollBirdsNestType, rollGemRockResult, rollGemType } from '@engine/world/skill-util/harvest-roll';
import { findItem } from '@engine/config/config-handler';
import { activeWorld } from '@engine/world';
import { loopingEvent } from '@engine/plugins';

/**
 * Check if a player can harvest a given {@link IHarvestable}
 *
 * @returns a {@link HarvestTool} if the player can harvest the object, or undefined if they cannot.
 */
export function canInitiateHarvest(player: Player, target: Pick<IHarvestable, 'itemId' | 'level'>, skill: Skill): undefined | HarvestTool {
    if (!target) {
        switch (skill) {
            case Skill.MINING:
                player.sendMessage('There is current no ore available in this rock.');
                player.playSound(soundIds.oreEmpty, 7, 0);
                break;
            case Skill.FISHING:
                player.sendMessage('There are no fish in that spot.');
                break;
            default:
                player.sendMessage(colorText('HARVEST SKILL ERROR, PLEASE CONTACT DEVELOPERS', colors.red));
                break;
        }
        return;
    }

    let targetName: string = findItem(target.itemId).name.toLowerCase();
    switch (skill) {
        case Skill.MINING:
            targetName = targetName.replace(' ore', '');
            break;
        case Skill.FISHING:
            targetName = 'fish';
            break;
    }


    // Check player level against the required level
    if (!player.skills.hasLevel(skill, target.level)) {
        switch (skill) {
            case Skill.MINING:
                player.sendMessage(`You need a Mining level of ${target.level} to mine this rock.`, true);
                break;
            case Skill.FISHING:
                player.sendMessage(`You need a Fishing level of ${target.level} to fish at this spot.`);
                break;
            case Skill.WOODCUTTING:
                player.sendMessage(`You need a Woodcutting level of ${target.level} to chop down this tree.`, true);
                break;
        }
        return;
    }

    // Check the players equipment and inventory for a tool
    let tool;
    switch (skill) {
        case Skill.MINING:
            tool = getBestPickaxe(player);
            break;
        case Skill.FISHING:
            // TODO (jameshallam93): different spots need different equipment
            tool = getFishingRod(player);
            break;
        case Skill.WOODCUTTING:
            tool = getBestAxe(player);
            break;
    }

    // TODO (jameshallam93): some activities need more than one tool, e.g. bait

    if (tool == null) {
        switch (skill) {
            case Skill.MINING:
                player.sendMessage('You do not have a pickaxe for which you have the level to use.');
                break;
            case Skill.FISHING:
                player.sendMessage('You do not have a fishing rod for which you have the level to use.');
                break;
            case Skill.WOODCUTTING:
                player.sendMessage('You do not have an axe for which you have the level to use.');
                break;
        }
        return;
    }
    // Check if the players inventory is full, and notify them if its full.
    if (!player.inventory.hasSpace()) {
        player.sendMessage(`Your inventory is too full to hold any more ${targetName}.`, true);
        player.playSound(soundIds.inventoryFull);
        return;
    }
    return tool;


}

export function handleHarvesting(details: ObjectInteractionAction, tool: HarvestTool, target: IHarvestable, skill: Skill): void {
    let itemToAdd = target.itemId;
    // This is rune essence to pure essence
    if (itemToAdd === 1436 && details.player.skills.hasLevel(Skill.MINING, 30)) {
        itemToAdd = 7936;
    }
    // This is to deal with gem rocks
    if (details.object.objectId === 2111 && details.player.skills.hasLevel(Skill.MINING, 30)) {
        itemToAdd = rollGemRockResult().itemId;
    }
    let targetName: string = findItem(itemToAdd).name.toLowerCase();

    switch (skill) {
        case Skill.MINING:
            targetName = targetName.replace(' ore', '');
            break;
    }

    switch (skill) {
        case Skill.MINING:
            details.player.sendMessage('You swing your pick at the rock.');
            break;
        case Skill.FISHING:
            details.player.sendMessage('You cast your line out.');
            break;
        case Skill.WOODCUTTING:
            details.player.sendMessage('You swing your axe at the tree.');
            break;
    }
    details.player.face(details.position);
    details.player.playAnimation(tool.animation);

    // Create a looping action to handle the tick related actions in harvesting
    const loop = loopingEvent({ player: details.player });
    let elapsedTicks = 0;

    loop.event.subscribe(() => {

        // Check if the amount of ticks passed equal the tools pulses
        if (elapsedTicks % 3 === 0 && elapsedTicks != 0) {
            const successChance = randomBetween(0, 255);
            let toolLevel = tool.level - 1;
            if (tool.itemId === 1349 || tool.itemId === 1267) {
                toolLevel = 2;
            }
            const percentNeeded = target.baseChance + toolLevel + details.player.skills.values[skill].level;
            if (successChance <= percentNeeded) {
                if (details.player.inventory.hasSpace()) {
                    let randomLoot = false;
                    let roll = 0;
                    switch (skill) {
                        case Skill.MINING:
                            roll = randomBetween(1, checkForGemBoost(details.player));
                            if (roll === 1) {
                                randomLoot = true;
                                details.player.sendMessage(colorText('You found a rare gem.', colors.red));
                                details.player.giveItem(rollGemType());
                            }
                            break;
                        case Skill.WOODCUTTING:
                            roll = randomBetween(1, 256);
                            if (roll === 1) {
                                randomLoot = true;
                                details.player.sendMessage(colorText('A bird\'s nest falls out of the tree.', colors.red));
                                activeWorld.globalInstance.spawnWorldItem(rollBirdsNestType(), details.player.position,
                                    { owner: details.player, expires: 300 });
                            }
                            break;
                    }
                    if (!randomLoot) {
                        switch (skill) {
                            case Skill.MINING:
                                details.player.sendMessage(`You manage to mine some ${targetName}.`);
                                break;
                            case Skill.WOODCUTTING:
                                details.player.sendMessage(`You manage to chop some ${targetName}.`);
                                break;
                        }

                        details.player.giveItem(itemToAdd);

                    }
                    details.player.skills.addExp(skill, target.experience);
                    if (randomBetween(0, 100) <= target.break) {
                        details.player.playSound(soundIds.oreDepeleted);
                        details.player.instance.replaceGameObject(target.objects.get(details.object.objectId),
                            details.object, randomBetween(target.respawnLow, target.respawnHigh));
                        loop.cancel();
                        details.player.playAnimation(null);
                        return;
                    }
                } else {
                    details.player.sendMessage(`Your inventory is too full to hold any more ${targetName}.`, true);
                    details.player.playSound(soundIds.inventoryFull);
                    loop.cancel();
                    return;
                }
            }

        } else {
            if (elapsedTicks % 1 == 0 && elapsedTicks != 0) {
                switch (skill) {
                    case Skill.MINING:
                        details.player.playSound(soundIds.pickaxeSwing, 7, 0);
                        break;
                    case Skill.WOODCUTTING:
                        details.player.playSound(soundIds.axeSwing[Math.floor(Math.random() * soundIds.axeSwing.length)], 7, 0);
                        break;
                }
            }
        }
        if (elapsedTicks % 3 == 0 && elapsedTicks != 0) {
            details.player.playAnimation(tool.animation);
        }
        elapsedTicks++;
    }, () => {
    }, () => details.player.playAnimation(null));
}
