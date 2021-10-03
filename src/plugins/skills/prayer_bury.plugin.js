import { itemIds } from '../../engine/world/config/item-ids';
import { soundIds } from '../../engine/world/config/sound-ids';
import { animationIds } from '../../engine/world/config/animation-ids';
import { Achievements, giveAchievement } from '../../engine/world/actor/player/achievements';
import { Skill } from '../../engine/world/actor/skills';
import { widgets } from '@engine/config/config-handler';

const buryBonesHandler = async ({ player, itemSlot }) => {
    player.playAnimation(animationIds.buryBones);
    player.removeItem(itemSlot);
    player.playSound(soundIds.buryBones);
    player.skills.addExp(Skill.PRAYER, 4.5);

    giveAchievement(Achievements.BURY_BONES, player);
};

module.exports = {
    pluginId: 'rs:prayer_bury',
    hooks: [
        {
            type: 'item_interaction',
            widgets: widgets.inventory,
            options: 'bury',
            itemIds: itemIds.bones,
            handler: buryBonesHandler,
            cancelOtherActions: true
        }
    ]
};
