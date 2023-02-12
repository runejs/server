import { itemInteractionActionHandler } from '@engine/action';
import { findItem, widgets } from '@engine/config/config-handler';
import { soundIds } from '@engine/world/config/sound-ids';
import { ItemDetails } from '@engine/config/item-config';
import { logger } from '@runejs/common';

interface IGrimyHerb {
    grimy: ItemDetails;
    clean: ItemDetails;
    level: number;
    experience: number;
}

/**
 * A list of all the herbs that can be cleaned.
 *
 * (Jameskmonger) I have put ! after findItem() because we know the items exist.
 */
const herbs: IGrimyHerb[] = [
    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    {
        grimy: findItem('rs:grimy_guam')!,
        clean: findItem('rs:herb_guam')!,
        level: 3,
        experience: 2.5
    },
    {
        grimy: findItem('rs:grimy_marrentill')!,
        clean: findItem('rs:herb_marrentill')!,
        level: 5,
        experience: 3.8
    },
    {
        grimy: findItem('rs:grimy_tarromin')!,
        clean: findItem('rs:herb_tarromin')!,
        level: 11,
        experience: 5
    },
    {
        grimy: findItem('rs:grimy_harralander')!,
        clean: findItem('rs:herb_harralander')!,
        level: 20,
        experience: 6.3
    },
    {
        grimy: findItem('rs:grimy_ranarr')!,
        clean: findItem('rs:herb_ranarr')!,
        level: 25,
        experience: 7.5
    },
    {
        grimy: findItem('rs:grimy_toadflax')!,
        clean: findItem('rs:herb_toadflax')!,
        level: 30,
        experience: 8
    },
    {
        grimy: findItem('rs:grimy_irit')!,
        clean: findItem('rs:herb_irit')!,
        level: 40,
        experience: 8.8
    },
    {
        grimy: findItem('rs:grimy_avantoe')!,
        clean: findItem('rs:herb_avantoe')!,
        level: 48,
        experience: 10
    },
    {
        grimy: findItem('rs:grimy_kwuarm')!,
        clean: findItem('rs:herb_kwuarm')!,
        level: 54,
        experience: 11.3
    },
    {
        grimy: findItem('rs:grimy_snapdragon')!,
        clean: findItem('rs:herb_snapdragon')!,
        level: 59,
        experience: 11.8
    },
    {
        grimy: findItem('rs:grimy_cadantine')!,
        clean: findItem('rs:herb_cadantine')!,
        level: 65,
        experience: 12.5
    },
    {
        grimy: findItem('rs:grimy_lantadyme')!,
        clean: findItem('rs:herb_lantadyme')!,
        level: 67,
        experience: 13.1
    },
    {
        grimy: findItem('rs:grimy_dwarf_weed')!,
        clean: findItem('rs:herb_dwarf_weed')!,
        level: 70,
        experience: 13.8
    },
    {
        grimy: findItem('rs:grimy_torstol')!,
        clean: findItem('rs:herb_torstol')!,
        level: 75,
        experience: 15
    },
    /* eslint-enable @typescript-eslint/no-non-null-assertion */
]


export const action: itemInteractionActionHandler = details => {
    const { player, itemId, itemSlot } = details;
    const herb = herbs.find((herb) => herb.grimy.gameId === itemId);
    if(!herb) {
        return;
    }
    if(!player.skills.hasLevel('herblore', herb.level)) {
        player.sendMessage(`You need a Herblore level of ${herb.level} to identify this herb.`, true);
        return;
    }

    const inventoryItem = player.inventory.items[itemSlot];

    // Always check for cheaters
    if (!inventoryItem) {
        logger.warn(`[herblore] Player ${player.username} tried to clean herb without having it in their inventory.`);
        return;
    }

    if (inventoryItem.itemId !== herb.grimy.gameId) {
        logger.warn(`[herblore] Player ${player.username} tried to clean herb but itemId did not match.`);
        return;
    }

    player.skills.addExp('herblore', herb.experience);
    player.inventory.set(itemSlot, { itemId: herb.clean.gameId, amount: 1 });
    details.player.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, details.player.inventory);
    player.playSound(soundIds.herblore.clean_herb);
};

export default {
    type: 'item_action',
    widgets: widgets.inventory,
    options: 'identify',
    itemIds: herbs.map((herb) => herb.grimy.gameId),
    action,
    cancelOtherActions: true
};
