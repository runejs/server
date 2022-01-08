import {
  ItemOnItemAction,
  ItemOnItemActionHook,
} from "@engine/action";
import { widgets } from "@engine/config/config-handler";
import items from './items';

const GRINDABLES = {
  1973: 1975, // Chocolate Bar
  9735: 9736, // Goat Horn
  9016: 9018, // Gorak Claw
  243: 241,  // Dragon Scale Dust
  5075: 6693,// Crushed Nest
};

const PESTLE_AND_MORTAR = 233;
const BIRDS_NEST = 5075;
const GRIND_ANIMATION = 364;

const handler = ({
  player,
  usedItem,
  usedSlot,
  usedWithItem,
  usedWithSlot,
}: ItemOnItemAction) => {
  const grindable = usedItem.itemId === PESTLE_AND_MORTAR
    ? { id: usedWithItem.itemId, slot: usedWithSlot }
    : { id: usedItem.itemId, slot: usedSlot };

  player.inventory.set(grindable.slot, { itemId: GRINDABLES[grindable.id], amount: 1 });
  player.playAnimation(GRIND_ANIMATION);
  // I don't know what the grind sound id is, but it should be played here.
  player.sendMessage(grindable.id === BIRDS_NEST
    ? 'You crush the bird\'s nest.'
    : `You grind the ${items[grindable.id].name.toLowerCase()} down to a dust.`);
  player.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, player.inventory);
};

export default {
  pluginId: "rs:grind-item",
  hooks: [
    {
      acceptItems: (item1: number, item2: number) =>
        [item1, item2].includes(PESTLE_AND_MORTAR) && // Check we have a Pestle and Mortar
        Object.keys(GRINDABLES).find(id => [item1, item2].includes(+id)), // Check we have atleast one grindable item
      handler,
      type: "item_on_item",
    } as ItemOnItemActionHook,
  ],
};
