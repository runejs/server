import { objectAction } from '@server/world/actor/player/action/object-action';
import { Skill } from '@server/world/actor/skills';
import { canInitiateHarvest, handleHarvesting } from '@server/world/skill-util/harvest-skill';
import { getTreeFromHealthy, getTreeIds } from '@server/world/config/harvestable-object';

const action: objectAction = (details) => {
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
