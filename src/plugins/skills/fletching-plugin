import { itemOnItemAction } from '@server/world/actor/player/action/item-on-item-action';
import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { itemIds } from '@server/world/config/item-ids';
import { Skill } from '@server/world/actor/skills';
import { gameCache } from '@server/game-server';
import { itemSelectionAction } from '@server/world/actor/player/action/item-selection-action';
import { Item } from '@server/world/items/item';
import { loopingAction } from '@server/world/actor/player/action/action';

const arrows = {
    HEADLESS_ARROW: {level: 1, exp: 1.0, tip: 52, with: 314, id: 53},
    BRONZE_ARROW: {level: 1, exp: 1.3, tip: 39, id: 882},
    IRON_ARROW: {level: 15, exp: 2.5, tip: 40, id: 884},
    STEEL_ARROW: {level: 30, exp: 5.0, tip: 41, id: 886},
    MITHRIL_ARROW: {level: 45, exp: 7.5, tip: 42, id: 888},
    ADAMANT_ARROW: {level: 60, exp: 10.0, tip: 43, id: 890},
    RUNE_ARROW: {level: 75, exp: 12.5, tip: 44, id: 892}
};

const bows = {
    ARROW_SHAFT: {level: 1, exp: 5.0, unstrung: 52, strung: -1},
    SHORTBOW: {level: 5, exp: 5.0, unstrung: 50, strung: 841},
    LONGBOW: {level: 10, exp: 10.0, unstrung: 48, strung: 839},
    OAK_SHORTBOW: {level: 20, exp: 16.5, unstrung: 54, strung: 843},
    OAK_LONGBOW: {level: 25, exp: 25.0, unstrung: 56, strung: 845},
    WILLOW_SHORTBOW: {level: 35, exp: 33.3, unstrung: 60, strung: 847},
    WILLOW_LONGBOW: {level: 40, exp: 41.5, unstrung: 58, strung: 849},
    MAPLE_SHORTBOW: {level: 50, exp: 50.0, unstrung: 64, strung: 853},
    MAPLE_LONGBOW: {level: 55, exp: 58.3, unstrung: 62, strung: 851},
    YEW_SHORTBOW: {level: 65, exp: 67.5, unstrung: 68, strung: 857},
    YEW_LONGBOW: {level: 70, exp: 75.0, unstrung: 66, strung: 855},
    MAGIC_SHORTBOW: {level: 80, exp: 83.3, unstrung: 72, strung: 861},
    MAGIC_LONGBOW: {level: 85, exp: 91.5, unstrung: 70, strung: 859}
};

const logs = {
    NORMAL: {logId: 1511, makeableItems: [bows.SHORTBOW, bows.LONGBOW, bows.ARROW_SHAFT], animationId: 1248},
    OAK: {logId: 1521, makeableItems: [bows.OAK_SHORTBOW, bows.OAK_LONGBOW]},
    WILLOW: {logId: 1519, makeableItems: [bows.WILLOW_SHORTBOW, bows.WILLOW_LONGBOW]},
    MAPLE: {logId: 1517, makeableItems: [bows.MAPLE_SHORTBOW, bows.MAPLE_LONGBOW]},
    YEW: {logId: 1515, makeableItems: [bows.YEW_SHORTBOW, bows.YEW_LONGBOW]},
    MAGIC: {logId: 1513, makeableItems: [bows.MAGIC_SHORTBOW, bows.MAGIC_LONGBOW]}
};

const cycle = (player, i, max) => {
    player.playAnimation(6782);
    return i < max;
};

const cutLogAction: itemOnItemAction = (details) => {
    const {player, usedItem, usedWithItem, usedSlot, usedWithSlot} = details;
    const log = usedItem.itemId !== itemIds.knife ? usedItem : usedWithItem;
    const skillInfo = Object.keys(logs).find(l => logs[l].logId === log.itemId);
    const makeableItems = logs[skillInfo].makeableItems;
    const makeableItemsInfo = [];
    makeableItems.forEach(item => makeableItemsInfo.push({
        itemId: item.unstrung,
        itemName: gameCache.itemDefinitions.get(item.unstrung).name
    }));
    itemSelectionAction(player, 'MAKING', makeableItemsInfo).then(choice => {
        if (!choice) {
            return;
        } else {
            const skillInfo = Object.keys(bows).find(l => (bows[l].unstrung === choice.itemId));
            const makingItem = bows[skillInfo];
            if (player.skills.values[Skill.FLETCHING].level > makingItem.level) {
                player.sendMessage(`You need a Fletching level of ${makingItem.level} to cut this.`);
            } else {
                const requiredLog = Object.keys(logs).find(log => logs[log].makeableItems.includes(makingItem));
                const logCount = player.inventory.items.filter((item: Item) => {
                    if (item) {
                        return item.itemId === logs[requiredLog].logId;
                    }
                }).length;
                const makingCount = Math.min(logCount, choice.amount);
                let madeCount = 0;
                let elapsedTicks = 0;
                const loop = loopingAction({player: player});
                loop.event.subscribe(() => {
                    if (elapsedTicks === 1) {
                        player.playAnimation(logs[requiredLog].animationId);
                    } else if (elapsedTicks === 2) {
                        if (player.hasItemInInventory(logs[requiredLog].logId)) {
                            player.removeFirstItem(logs[requiredLog].logId);
                            const itemMade = makingItem.unstrung;
                            if (itemMade === bows.ARROW_SHAFT.unstrung) {
                                player.giveItem({itemId: itemMade, amount: 15});
                            } else {
                                player.giveItem(itemMade);
                            }
                            player.skills.addExp(Skill.FLETCHING, makingItem.exp);
                            madeCount++;
                            if (madeCount === makingCount) {
                                loop.cancel();
                                return;
                            }
                        }
                    } else if (elapsedTicks === 3) {
                        elapsedTicks = 0;
                    }
                    elapsedTicks++;
                });
            }
        }
    }).catch(error => console.log(error));
};

const attachArrowAction: itemOnItemAction = (details) => {
    const {player, usedItem, usedWithItem, usedSlot, usedWithSlot} = details;
    const skillInfo = Object.keys(arrows).find(l => (arrows[l].tip === usedItem.itemId && arrows[l].with === usedWithItem.itemId) || (arrows[l].tip === usedWithItem.itemId && arrows[l].with === usedItem.itemId));
    const arrow = arrows[skillInfo];
    if (player.skills.values[Skill.FLETCHING].level < arrow.level) {
        player.sendMessage(`You need a Fletching level of ${arrow.level} to attach this.`);
    } else {
        const tipItem: number = arrow.tip;
        const withItem: number = arrow.with;
        const withCount = player.inventory.amountInStack(player.inventory.findIndex(withItem));
        const tipCount = player.inventory.amountInStack(player.inventory.findIndex(tipItem));
        let setAmount = Math.min(withCount, tipCount);
        setAmount = Math.min(setAmount, 15);
        if (setAmount > 0) {
            const newWithCount = withCount - setAmount;
            const newTipCount = tipCount - setAmount;
            const createdItem = arrow.id;
            player.removeItem(player.inventory.findIndex(tipItem));
            if (newTipCount > 0) {
                player.giveItem({itemId: tipItem, amount: newTipCount});
            }
            player.removeItem(player.inventory.findIndex(withItem));
            if (newWithCount > 0) {
                player.giveItem({itemId: withItem, amount: newWithCount});
            }
            player.giveItem({itemId: createdItem, amount: setAmount});
            player.sendMessage(`You attach the ${gameCache.itemDefinitions.get(tipItem).name} to the ${gameCache.itemDefinitions.get(withItem).name}.`);
            player.skills.addExp(Skill.FLETCHING, arrow.exp * setAmount);
        }
    }
};
export default new RunePlugin([{
    type: ActionType.ITEM_ON_ITEM,
    items: Object.keys(logs).map(log => ({item1: itemIds.knife, item2: logs[log].logId})),
    action: cutLogAction
}, {
    type: ActionType.ITEM_ON_ITEM,
    items: Object.keys(arrows).map(arrow => ({item1: arrows[arrow].tip, item2: arrows[arrow].with})),
    action: attachArrowAction
}]);
