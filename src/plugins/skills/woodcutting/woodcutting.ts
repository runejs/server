import { objectInteractionActionHandler } from '@engine/world/action/object-interaction.action';
import { Skill } from '@engine/world/actor/skills';
import { canInitiateHarvest, handleHarvesting } from '@engine/world/skill-util/harvest-skill';
import { getTreeFromHealthy, getTreeIds } from '@engine/world/config/harvestable-object';

const action: objectInteractionActionHandler = (details) => {
    const tree = getTreeFromHealthy(details.object.objectId);
    const tool = canInitiateHarvest(details.player, tree, Skill.WOODCUTTING);

    if (!tool) {
        return;
    }
    handleHarvesting(details, tool, tree, Skill.WOODCUTTING);

};


export default {
    type: 'object_action',
    options: ['chop down', 'chop'],
    objectIds: getTreeIds(),
    walkTo: true,
    action
};
