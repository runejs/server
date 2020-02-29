import { World } from '@server/world/world';
import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { itemIds } from '@server/world/config/item-ids';
import { itemOnObjectAction } from '@server/world/actor/player/action/item-on-object-action';
import { objectAction } from '@server/world/actor/player/action/object-action';
import { gameCache } from '@server/game-server';
import { animationIds } from '@server/world/config/animation-ids';
import { soundIds } from '@server/world/config/sound-ids';
import { dialogueAction, DialogueEmote } from '@server/world/actor/player/action/dialogue-action';
import { npcIds } from '@server/world/config/npc-ids';


export const action: objectAction = (details) => {
    const {player, objectDefinition} = details;

    if (!details.player.metadata['flour']) {
        player.outgoingPackets.chatboxMessage(`The ${objectDefinition.name.toLowerCase()} is already empty. You need to place wheat in the hopper upstairs `);
        player.outgoingPackets.chatboxMessage(`first.`);
        return;
    }
    const emptyBucketItem = gameCache.itemDefinitions.get(itemIds.pot);

    if (player.hasItemInInventory(itemIds.pot)) {
        player.outgoingPackets.playSound(soundIds.potContentModified, 7);
        player.removeFirstItem(itemIds.pot);
        player.giveItem(itemIds.potOfFlour);
        details.player.metadata['flour'] -= 1;
    } else {
        player.outgoingPackets.chatboxMessage(`You need a pot to hold the flour in.`);
    }
};

export default new RunePlugin([
    {
        type: ActionType.ITEM_ON_OBJECT_ACTION,
        objectIds: [1782],
        itemIds: [itemIds.pot],
        options: ['empty'],
        walkTo: true,
        action
    },
    {
        type: ActionType.OBJECT_ACTION,
        objectIds: [1782],
        options: ['empty'],
        walkTo: true,
        action
    }
]);
