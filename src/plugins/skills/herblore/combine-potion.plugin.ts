import {
  ItemOnItemAction,
  ItemOnItemActionHook,
} from "@engine/action";
import { widgets } from "@engine/config/config-handler";
import items from './items';

const EMPTY_VIAL_ID = 229;
const MAX_DOSES = 4;
const PotionRegex = /(.*)\((1|2|3|4)\)/;

const handler = ({
  player,
  usedItem,
  usedWithItem,
  usedSlot,
  usedWithSlot,
}: ItemOnItemAction) => {
  const potion1 = items[usedItem.itemId].name.match(PotionRegex);
  const potion2 = items[usedWithItem.itemId].name.match(PotionRegex);

  const potions = [
    { name: potion1[1], dose: Number(potion1[2]) },
    { name: potion2[1], dose: Number(potion2[2]) },
  ];

  if (potions[0].name !== potions[1].name) {
    player.sendMessage('Nothing interesting happens.');
    return;
  }

  if (potions[0].dose === MAX_DOSES || potions[1].dose === MAX_DOSES) {
    player.sendMessage('Cannot combine potions.');
    return;
  }

  const total = potions[0].dose + potions[1].dose;
  const major = Math.min(total, MAX_DOSES)
  const leftover = Math.max(total - MAX_DOSES, 0);

  const findPotion = (name: string, dose: number) => items.find(i => i?.name === `${name}(${dose})`);

  player.inventory.set(usedSlot, {
    itemId: leftover === 0
      ? EMPTY_VIAL_ID
      : findPotion(potions[0].name, leftover).id,
    amount: 1,
  });

  player.inventory.set(usedWithSlot, { itemId: findPotion(potions[0].name, major).id, amount: 1 })
  player.sendMessage(`You have combined the liquid into ${major} doses.`);
  player.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, player.inventory);
};

const HasDoseRegex = /\((1|2|3|4)\)$/;

export default {
  pluginId: "rs:combine_potion",
  hooks: [
    {
      acceptItems: (item1, item2) => [items[item1], items[item2]].every(i => HasDoseRegex.test(i.name)),
      handler,
      type: "item_on_item",
    } as ItemOnItemActionHook,
  ],
};
