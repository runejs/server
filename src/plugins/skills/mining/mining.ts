import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { getAllOreIds, getOreFromRock } from '@server/world/config/ore';
import { objectAction } from '@server/world/actor/player/action/object-action';
import { Skill } from '@server/world/actor/skills';
import { getBestPickaxe } from '@server/world/config/pickaxe';
import { loopingAction } from '@server/world/actor/player/action/action';
import { randomBetween } from '@server/util/num';
import { cache, world } from '@server/game-server';
import { soundIds } from '@server/world/config/sound-ids';

const action: objectAction = (details) => {
    // Get the mining details for the target rock
    const ore = getOreFromRock(details.object.objectId);

    // getOreFromRock only returns ores that are minable
    if (!ore) {
        details.player.sendMessage('There is current no ore available in this rock.');
        details.player.playSound(soundIds.oreEmpty, 7, 0);
        return;
    }

    // Check player level against the required level
    if (!details.player.skills.hasSkillLevel(Skill.MINING, ore.level)) {
        details.player.sendMessage(`You need a Mining level of ${ore.level} to mine this rock.`, true);
        return;
    }
    const oreName = cache.itemDefinitions.get(ore.itemId).name.toLowerCase().replace(' ore', '');
    // Check the players equipment and inventory for a pickage
    const pickaxe = getBestPickaxe(details.player);
    if (pickaxe == null) {
        details.player.sendMessage('You do not have a pickaxe for which you have the level to use.');
        return;
    }

    // Check if the players inventory is full, and notify them if its full.
    if (!details.player.inventory.hasSpace()) {
        details.player.sendMessage(`Your inventory is too full to hold any more ${oreName}.`, true);
        details.player.playSound(soundIds.inventoryFull);
        return;
    }

    details.player.sendMessage('You swing your pick at the rock.');
    details.player.face(details.position);
    details.player.playAnimation(pickaxe.animation);

    // Create a looping action to handle the tick related actions in mining
    const loop = loopingAction({player: details.player});
    let elapsedTicks = 0;

    loop.event.subscribe(() => {
        // Check if the amount of ticks passed equal the pickaxes pulses
        if (elapsedTicks % pickaxe.pulses === 0 && elapsedTicks != 0) {
            const successChance = randomBetween(0, 100);
            const percentNeeded = (ore.chance * details.player.skills.values[Skill.MINING].level + ore.chanceOffset) * 100;
            if (successChance < percentNeeded) {
                if (details.player.inventory.hasSpace()) {
                    details.player.playSound(soundIds.oreDepeleted);

                    details.player.sendMessage(`You manage to mine some ${oreName}.`);
                    details.player.giveItem(ore.itemId);
                    details.player.skills.addExp(Skill.MINING, ore.experience);
                    world.replaceLocationObject(ore.objects.get(details.object.objectId), details.object, ore.respawn);
                    loop.cancel();
                    details.player.playAnimation(null);
                    return;
                } else {
                    details.player.sendMessage(`Your inventory is too full to hold any more ${oreName}.`, true);
                    details.player.playSound(soundIds.inventoryFull);
                    loop.cancel();
                    return;
                }
            } else {
                details.player.playAnimation(pickaxe.animation);
            }
        } else {
            if (elapsedTicks % 1 == 0 && elapsedTicks != 0) {
                details.player.playSound(soundIds.pickaxeSwing, 7, 0);
            }
        }
        elapsedTicks++;
    });
};


export default new RunePlugin({
    type: ActionType.OBJECT_ACTION,
    options: ['mine'],
    objectIds: getAllOreIds(),
    walkTo: true,
    action
});
