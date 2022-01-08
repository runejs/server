import {
  ItemOnItemAction,
  ItemOnItemActionHook,
} from "@engine/action";
import { widgets } from "@engine/config/config-handler";
import ingredients from './ingredients';

const VIAL_OF_WATER = 227;
const ANIMATION = 363;
const SOUND = 2608;

const items = ingredients.filter(i => i.materials && Object.keys(i.materials).length >= 2).map(({ materials }) => {
  const [item1, item2] = Object.keys(materials);
  const find = (item: string) => ingredients.find(i => i.name === item)?.id
  return {
    item1: find(item1),
    item2: find(item2) || undefined
  }
});

const outputIngredient = (item1, item2) =>
  ingredients
    .find(i => i.materials && Object.keys(i.materials).length >= 2 && Object.keys(i.materials).every(k => [item1.name, item2.name].includes(k)));

const handler = ({
  player,
  usedItem,
  usedWithItem,
  usedSlot,
  usedWithSlot,
}: ItemOnItemAction) => {
  const item1 = ingredients.find(({ id }) => id === usedItem.itemId);
  const item2 = ingredients.find(({ id }) => id === usedWithItem.itemId);
  const output = outputIngredient(item1, item2);

  if (!output) {
    player.sendMessage('Nothing interesting happens.');
    return;
  }

  if (player.skills.herblore.level < output.levelRequired) {
    player.sendMessage(`Level ${output.levelRequired} Herblore is required.`);
    return;
  }

  player.inventory.remove(usedSlot);
  player.inventory.remove(usedWithSlot);
  if ([item1.id, item2.id].includes(VIAL_OF_WATER)) {
    // 2259 - Pouring Vial Onto Ground
    const herb = [item1, item2].find(i => i.id !== VIAL_OF_WATER);
    player.sendMessage(`You put the clean ${herb.name} into the vial of water.`);
  } else {
    const secondary = [item1, item2].find(i => !i.name.includes('(unf)'));
    player.sendMessage(`You carefully mix the ${secondary.name.toLowerCase()} into your potion.`);
  }
  player.playAnimation(ANIMATION);
  player.playSound(SOUND);
  player.skills.addExp('herblore', output.xpGain);
  player.inventory.add({ itemId: output.id, amount: 1 });
  player.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, player.inventory);
};

export default {
  pluginId: "rs:mix_potion",
  hooks: [
    {
      items,
      handler,
      type: "item_on_item",
    } as ItemOnItemActionHook,
  ],
};
