import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { objectAction, ObjectActionDetails } from '@server/world/actor/player/action/object-action';
import { Skill } from '@server/world/actor/skills';
import { widgets } from '@server/world/config/widget';
import {
    altars,
    getEntityByAttr,
    getEntityIds, runeMultiplier,
    runes,
} from '@server/plugins/skills/runecrafting/constants';



const craftRune: objectAction = (details: ObjectActionDetails) => {
    const {player, object} = details;
    const rune = getEntityByAttr(runes, 'altar.craftingId', object.objectId);
    const level = player.skills.get(Skill.RUNECRAFTING).level;

    let essenceAvailable = 0;
    rune.essence.forEach((essenceId) => {
        essenceAvailable += player.inventory.findAll(essenceId).length;
    });

    if (essenceAvailable > 0) {
        // Remove essence from inventory.
        rune.essence.forEach((essenceId) => {
            player.inventory.findAll(essenceId).forEach((index) => {
                player.inventory.remove(index);
            });
        });
        // Add crafted runes to inventory.
        player.inventory.add({itemId: rune.id, amount: (runeMultiplier(rune.id, level) * essenceAvailable)});
        // Add experience
        player.skills.addExp(Skill.RUNECRAFTING, (rune.xp * essenceAvailable));
        // Update widget items.
        player.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, player.inventory);
        return ;
    }

    player.sendMessage(`You do not have any rune essence to bind.`);
};




export default new RunePlugin([
    {
        type: ActionType.OBJECT_ACTION,
        objectIds: getEntityIds(altars, 'craftingId'),
        walkTo: true,
        action: craftRune
    }
]);
