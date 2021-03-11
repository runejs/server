import { itemIds } from '../../game-engine/world/config/item-ids';
import { soundIds } from '../../game-engine/world/config/sound-ids';
import { animationIds } from '../../game-engine/world/config/animation-ids';
import { Achievements, giveAchievement } from '../../game-engine/world/actor/player/achievements';
import { Skill } from '../../game-engine/world/actor/skills';
import { widgets } from '../../game-engine/config';

const action = async details => {
    const { player, itemSlot } = details;

    player.playAnimation(animationIds.buryBones);
    player.removeItem(itemSlot);
    player.playSound(soundIds.buryBones);
    player.skills.addExp(Skill.PRAYER, 4.5);

    giveAchievement(Achievements.BURY_BONES, player);
};

module.exports = {
    type: 'item_action',
    widgets: widgets.inventory,
    options: 'bury',
    itemIds: itemIds.bones,
    handler: action,
    cancelOtherActions: true
};
