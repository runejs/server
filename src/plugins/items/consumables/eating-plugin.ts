import { itemAction } from '@server/world/action/item-action';
import { widgets } from '@server/config';
import { SkillName } from '@server/world/actor/skills';
import { animationIds } from '@server/world/config/animation-ids';
import { soundIds } from '@server/world/config/sound-ids';
import { randomBetween } from '@server/util/num';
import { World } from '@server/world';

export const action: itemAction = (details) => {
    const { player, itemId, itemSlot, itemDetails } = details;
    if(!itemDetails.consumable) {
        player.sendMessage('Item is not registered as consumable!');
        return;
    }
    if(!itemDetails.metadata.consume_effects) {
        player.sendMessage('Item is missing consume effects!');
        return;
    }
    if(!itemDetails.metadata.consume_effects.clock) {
        player.sendMessage('Item is missing clock!');
        return;
    }
    if(itemDetails.metadata.consume_effects.special){
        player.sendMessage('Cannot handle special foods yet!');
        return;
    }
    const clock = 'clock_'+itemDetails.metadata.consume_effects.clock;
    // Check if player recently ate
    if(player.metadata[clock]){
        return;
    }

    if(player.inventory.items[itemSlot].itemId !== itemId){
        return;
    }

    player.inventory.items[itemSlot] = null;
    player.playSound(soundIds.eat);
    player.playAnimation(animationIds.eat)


    details.player.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, details.player.inventory);

    // Set a timeout so player cant spam eat
    player.metadata[clock] = true;
    setTimeout(() => {
        player.metadata[clock] = false;
    }, World.TICK_LENGTH * 3);

    if(itemDetails.metadata.consume_effects.energy) {
        // TODO: Give player run energy
    }
    if(itemDetails.metadata.consume_effects.skills) {
        const skillModifiers = itemDetails.metadata.consume_effects.skills;
        for (const sk in skillModifiers) {
            const skill: SkillName = sk as SkillName;
            let value;
            if (Array.isArray(skillModifiers[skill])){
                value = randomBetween(skillModifiers[skill][0], skillModifiers[skill][1]);
            } else {
                value = skillModifiers[skill];
            }
            const playerSkill  = player.skills[skill];
            const maxLevel = playerSkill.levelForExp;
            const currentLevel = playerSkill.level || playerSkill.levelForExp;

            if(skill === 'hitpoints') {
                let newHealth: number = currentLevel + value;
                if(newHealth > maxLevel) {
                    newHealth = maxLevel;
                }
                playerSkill.level = newHealth;
                player.sendMessage(`You eat the ${itemDetails.name}, and it restores ${newHealth - currentLevel} health.`)
            } else {
                let newLevel: number =  currentLevel + value;
                if(newLevel > maxLevel + value) {
                    newLevel = maxLevel + value;
                }
                playerSkill.level = newLevel;
            }
            player.outgoingPackets.updateSkill(player.skills.getSkillId(skill), playerSkill.level, playerSkill.exp);

        }
    }



};

export default {
    type: 'item_action',
    widgets: widgets.inventory,
    options: 'eat',
    action,
    cancelOtherActions: true
};
