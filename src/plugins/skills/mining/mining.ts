import { objectAction } from '@engine/world/action/object-action';
import { Skill } from '@engine/world/actor/skills';
import { canInitiateHarvest, handleHarvesting } from '@engine/world/skill-util/harvest-skill';
import { getAllOreIds, getOreFromRock } from '@engine/world/config/harvestable-object';

const action: objectAction = (details) => {
    // Get the mining details for the target rock
    const ore = getOreFromRock(details.object.objectId);
    const tool = canInitiateHarvest(details.player, ore, Skill.MINING);

    if (!tool) {
        return;
    }
    handleHarvesting(details, tool, ore, Skill.MINING);

};


export default {
    type: 'object_action',
    options: ['mine'],
    objectIds: getAllOreIds(),
    walkTo: true,
    action
};
