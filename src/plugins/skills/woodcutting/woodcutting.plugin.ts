import {
    ObjectInteractionAction,
    objectInteractionActionHandler,
    ObjectInteractionActionHook
} from '@engine/world/action/object-interaction.action';
import { Skill } from '@engine/world/actor/skills';
import { canInitiateHarvest, handleHarvesting } from '@engine/world/skill-util/harvest-skill';
import { getTreeFromHealthy, getTreeIds, IHarvestable, Tree } from '@engine/world/config/harvestable-object';
import { TaskExecutor } from '@engine/world/action';
import { Player } from '@engine/world/actor/player/player';
import { randomBetween } from '@engine/util/num';
import { checkForGemBoost } from '@engine/world/skill-util/glory-boost';
import { colorText } from '@engine/util/strings';
import { colors } from '@engine/util/colors';
import { rollBirdsNestType } from '@engine/world/skill-util/harvest-roll';
import { cache, world } from '@engine/game-server';
import { soundIds } from '@engine/world/config/sound-ids';
import { Axe, getAxe } from '@engine/world/config/harvest-tool';


const canActivate = (task: TaskExecutor<ObjectInteractionAction>): boolean => {
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

    player?.sendMessage('You swing your axe at the tree.');

    actor.face(position);
    actor.playAnimation(tool.animation);

    return true;
};


const activate = (task: TaskExecutor<ObjectInteractionAction>, elapsedTicks: number): void => {
    const {
        actor,
        actionData: {
            position: objectPosition,
            object: {
                objectId
            }
        }
    } = task;

    const {
        type: {
            player
        }, isPlayer
    } = actor;

    const tree = getTreeFromHealthy(objectId);
    const tool = isPlayer ? canInitiateHarvest(player, tree, Skill.WOODCUTTING) : getAxe(Axe.STEEL);

    // Cancel if the actor no longer has their tool or level requirements.
    if(!tool) {
        task.stop();
        return;
    }

    // Grab the tree manually every loop so that we can make sure it's still alive.
    const { object } = world.findObjectAtLocation(actor, objectId, objectPosition);

    if(!object) {
        // Tree has been chopped down, cancel.
        task.stop();
        return;
    }

    // Check if the amount of ticks passed equal the tools pulses.
    if(elapsedTicks % 3 === 0 && elapsedTicks != 0) {
        const successChance = randomBetween(0, 255);

        let toolLevel = tool.level - 1;
        if(tool.itemId === 1349 || tool.itemId === 1267) {
            toolLevel = 2;
        }

        const percentNeeded = tree.baseChance + toolLevel + actor.skills.woodcutting.level;
        if(successChance <= percentNeeded) {
            const targetName: string = cache.itemDefinitions.get(tree.itemId).name.toLowerCase();

            if(actor.inventory.hasSpace()) {
                let randomLoot = false;
                let roll = randomBetween(1, 256);
                if(roll === 1) {
                    randomLoot = true;
                    player?.sendMessage(colorText(`A bird's nest falls out of the tree.`, colors.red));
                    world.globalInstance.spawnWorldItem(rollBirdsNestType(), actor.position,
                        isPlayer ? { owner: player, expires: 300 } : { owner: null, expires: 300 });
                }

                const itemToAdd = tree.itemId;

                if(!randomLoot) {
                    player?.sendMessage(`You manage to chop some ${targetName}.`);
                    actor.giveItem(itemToAdd);
                }

                player?.skills.woodcutting.addExp(tree.experience);

                if(randomBetween(0, 100) <= tree.break) {
                    player?.playSound(soundIds.oreDepeleted);
                    actor.instance.replaceGameObject(tree.objects.get(objectId),
                        object, randomBetween(tree.respawnLow, tree.respawnHigh));
                    task.stop();
                    return;
                }
            } else {
                player?.sendMessage(`Your inventory is too full to hold any more ${targetName}.`, true);
                player?.playSound(soundIds.inventoryFull);
                task.stop();
                return;
            }
        }
    } else {
        if(elapsedTicks % 1 == 0 && elapsedTicks != 0) {
            player?.playSound(soundIds.axeSwing[Math.floor(Math.random() * soundIds.axeSwing.length)], 7, 0);
        }
    }

    if(elapsedTicks % 3 == 0 && elapsedTicks != 0) {
        actor.playAnimation(tool.animation);
    }
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
            // handler: action,
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
