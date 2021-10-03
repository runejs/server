import { itemInteractionActionHandler } from '@engine/action/pipe/item-interaction.action';
import { findItem, widgets } from '@engine/config/config-handler';
import { soundIds } from '@engine/world/config/sound-ids';
import { ItemDetails } from '@engine/config/item-config';

interface IGrimyHerb {
    grimy: ItemDetails;
    clean: ItemDetails;
    level: number;
    experience: number;
}
const herbs: IGrimyHerb[] = [
    {
        grimy: findItem('rs:grimy_guam'),
        clean: findItem('rs:herb_guam'),
        level: 3,
        experience: 2.5
    },
    {
        grimy: findItem('rs:grimy_marrentill'),
        clean: findItem('rs:herb_marrentill'),
        level: 5,
        experience: 3.8
    },
    {
        grimy: findItem('rs:grimy_tarromin'),
        clean: findItem('rs:herb_tarromin'),
        level: 11,
        experience: 5
    },
    {
        grimy: findItem('rs:grimy_harralander'),
        clean: findItem('rs:herb_harralander'),
        level: 20,
        experience: 6.3
    },
    {
        grimy: findItem('rs:grimy_ranarr'),
        clean: findItem('rs:herb_ranarr'),
        level: 25,
        experience: 7.5
    },
    {
        grimy: findItem('rs:grimy_toadflax'),
        clean: findItem('rs:herb_toadflax'),
        level: 30,
        experience: 8
    },
    {
        grimy: findItem('rs:grimy_irit'),
        clean: findItem('rs:herb_irit'),
        level: 40,
        experience: 8.8
    },
    {
        grimy: findItem('rs:grimy_avantoe'),
        clean: findItem('rs:herb_avantoe'),
        level: 48,
        experience: 10
    },
    {
        grimy: findItem('rs:grimy_kwuarm'),
        clean: findItem('rs:herb_kwuarm'),
        level: 54,
        experience: 11.3
    },
    {
        grimy: findItem('rs:grimy_snapdragon'),
        clean: findItem('rs:herb_snapdragon'),
        level: 59,
        experience: 11.8
    },
    {
        grimy: findItem('rs:grimy_cadantine'),
        clean: findItem('rs:herb_cadantine'),
        level: 65,
        experience: 12.5
    },
    {
        grimy: findItem('rs:grimy_lantadyme'),
        clean: findItem('rs:herb_lantadyme'),
        level: 67,
        experience: 13.1
    },
    {
        grimy: findItem('rs:grimy_dwarf_weed'),
        clean: findItem('rs:herb_dwarf_weed'),
        level: 70,
        experience: 13.8
    },
    {
        grimy: findItem('rs:grimy_torstol'),
        clean: findItem('rs:herb_torstol'),
        level: 75,
        experience: 15
    },
]


export const action: itemInteractionActionHandler = details => {
    const { player, itemId, itemSlot } = details;
    const herb: IGrimyHerb = herbs.find((herb) => herb.grimy.gameId === itemId);
    if(!herb) {
        return;
    }
    if(!player.skills.hasLevel('herblore', herb.level)) {
        player.sendMessage(`You need a Herblore level of ${herb.level} to identify this herb.`, true);
        return;
    }
    // Always check for cheaters
    if(!player.inventory.items[itemSlot] && player.inventory.items[itemSlot].itemId === herb.grimy.gameId) {
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
