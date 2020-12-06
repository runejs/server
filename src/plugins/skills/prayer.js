import { itemIds } from '../../world/config/item-ids';
import { soundIds } from '../../world/config/sound-ids';
import { animationIds } from '../../world/config/animation-ids';
import { Achievements, giveAchievement } from '../../world/actor/player/achievements';
import { Skill } from '../../world/actor/skills';
import { widgets } from '../../config';

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
    action,
    cancelOtherActions: true
};
