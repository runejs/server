import { objectInteractionActionHandler } from '@engine/action';
import { Skill } from '@engine/world/actor/skills';
import { getAllOreIds, getOreFromRock } from '@engine/world/config/harvestable-object';
import { getBestPickaxe, soundIds } from '@engine/world/config';
import { MiningTask } from './mining-task';

const action: objectInteractionActionHandler = (details) => {
    // Get the mining details for the target rock
    const ore = getOreFromRock(details.object.objectId);

    if (!ore) {
        details.player.sendMessage('There is current no ore available in this rock.');
        details.player.playSound(soundIds.oreEmpty, 7, 0);
        return;
    }

    if (!details.player.skills.hasLevel(Skill.MINING, ore.level)) {
        details.player.sendMessage(`You need a Mining level of ${ore.level} to mine this rock.`, true);
        return;
    }

    const tool = getBestPickaxe(details.player);

    if (!tool) {
        details.player.sendMessage('You do not have a pickaxe for which you have the level to use.');
        return;
    }

    if(!tool) {
        return;
    }

    details.player.sendMessage('You swing your pick at the rock.');
    details.player.face(details.position);
    details.player.playAnimation(tool.animation);

    //handleHarvesting(details, tool, ore, Skill.MINING);
    details.player.enqueueTask(MiningTask, [details.object, ore, tool]);
};


export default {
    pluginId: 'rs:mining',
    hooks: [ {
        type: 'object_interaction',
        options: [ 'mine' ],
        objectIds: getAllOreIds(),
        walkTo: true,
        handler: action
    } ]
};
