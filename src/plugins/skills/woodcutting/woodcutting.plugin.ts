import {
    ObjectInteractionAction,
    ObjectInteractionActionHook
} from '@engine/world/action/object-interaction.action';
import { Skill } from '@engine/world/actor/skills';
import { canInitiateHarvest } from '@engine/world/skill-util/harvest-skill';
import { getTreeFromHealthy, getTreeIds, IHarvestable } from '@engine/world/config/harvestable-object';
import { randomBetween } from '@engine/util/num';
import { colorText } from '@engine/util/strings';
import { colors } from '@engine/util/colors';
import { rollBirdsNestType } from '@engine/world/skill-util/harvest-roll';
import { world } from '@engine/game-server';
import { soundIds } from '@engine/world/config/sound-ids';
import { Axe, getAxe, HarvestTool } from '@engine/world/config/harvest-tool';
import { TaskExecutor } from '@engine/world/action';
import { findItem } from '@engine/config';


const canActivate = (task: TaskExecutor<ObjectInteractionAction>, taskIteration: number): boolean => {
    const { actor, actionData: { position, object } } = task;
    const tree = getTreeFromHealthy(object.objectId);

    if(!tree) {
        return false;
    }

    const { type: { player }, isPlayer } = actor;

    const tool = isPlayer ? canInitiateHarvest(player, tree, Skill.WOODCUTTING) : getAxe(Axe.STEEL);

    if(!tool) {
        return false;
    }

    task.session.tool = tool;
    task.session.tree = tree;

    if(taskIteration === 0) {
        // First run

        player?.sendMessage('You swing your axe at the tree.');

        actor.face(position);
        actor.playAnimation(tool.animation);
    }

    return true;
};


const activate = (task: TaskExecutor<ObjectInteractionAction>, taskIteration: number): boolean => {
    const { actor, player, actionData, session } = task.getDetails();
    const { position: objectPosition, object: actionObject } = actionData;
    const tree: IHarvestable = session.tree;
    const tool: HarvestTool = session.tool;

    // Cancel if the actor no longer has their tool or level requirements.
    if(!tool || !tree) {
        return false;
    }

    // Grab the tree manually every loop so that we can make sure it's still alive.
    const { object } = world.findObjectAtLocation(actor, actionObject.objectId, objectPosition);

    if(!object) {
        // Tree has been chopped down, cancel.
        return false;
    }

    // Check if the amount of ticks passed equal the tools pulses.
    if(taskIteration % 3 === 0 && taskIteration != 0) {
        const successChance = randomBetween(0, 255);

        let toolLevel = tool.level - 1;
        if(tool.itemId === 1349 || tool.itemId === 1267) {
            toolLevel = 2;
        }

        const percentNeeded = tree.baseChance + toolLevel + actor.skills.woodcutting.level;
        if(successChance <= percentNeeded) {
            const targetName: string = findItem(tree.itemId).name.toLowerCase();

            if(actor.inventory.hasSpace()) {
                const itemToAdd = tree.itemId;
                const roll = randomBetween(1, 256);

                if(roll === 1) { // Bird nest chance
                    player?.sendMessage(colorText(`A bird's nest falls out of the tree.`, colors.red));
                    world.globalInstance.spawnWorldItem(rollBirdsNestType(), actor.position,
                        { owner: player || null, expires: 300 });
                } else { // Standard log chopper
                    player?.sendMessage(`You manage to chop some ${targetName}.`);
                    actor.giveItem(itemToAdd);
                }

                player?.skills.woodcutting.addExp(tree.experience);

                if(randomBetween(0, 100) <= tree.break) {
                    player?.playSound(soundIds.oreDepeleted);
                    actor.instance.replaceGameObject(tree.objects.get(actionObject.objectId),
                        object, randomBetween(tree.respawnLow, tree.respawnHigh));
                    return false;
                }
            } else {
                player?.sendMessage(
                    `Your inventory is too full to hold any more ${targetName}.`, true);
                player?.playSound(soundIds.inventoryFull);
                return false;
            }
        }
    } else {
        if(taskIteration % 1 === 0 && taskIteration !== 0) {
            const randomSoundIdx = Math.floor(Math.random() * soundIds.axeSwing.length);
            player?.playSound(soundIds.axeSwing[randomSoundIdx], 7, 0);
        }
    }

    if(taskIteration % 3 === 0 && taskIteration !== 0) {
        actor.playAnimation(tool.animation);
    }

    return true;
};

const onComplete = (task: TaskExecutor<ObjectInteractionAction>): void => {
    task.actor.stopAnimation();
};


export default {
    pluginId: 'rs:woodcutting',
    hooks: [
        {
            type: 'object_interaction',
            options: [ 'chop down', 'chop' ],
            objectIds: getTreeIds(),
            strength: 'normal',
            task: {
                canActivate,
                activate,
                onComplete,
                interval: 1
            }
        } as ObjectInteractionActionHook
    ]
};
