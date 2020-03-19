import { itemOnItemAction } from '@server/world/actor/player/action/item-on-item-action';
import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { itemIds } from '@server/world/config/item-ids';
import { animationIds } from '@server/world/config/animation-ids';
import { Skill } from '@server/world/actor/skills';
import { cache } from '@server/game-server';
import { itemSelectionAction } from '@server/world/actor/player/action/item-selection-action';
import { Item } from '@server/world/items/item';
import { loopingAction } from '@server/world/actor/player/action/action';

const arrows = {
    HEADLESS_ARROW: {level: 1, exp: 1.0, tip: itemIds.arrowShaft, with: itemIds.feather, id: itemIds.arrows.headless},
    BRONZE_ARROW: {level: 1, exp: 1.3, tip: itemIds.arrowTips.bronze, id: itemIds.arrows.bronze},
    IRON_ARROW: {level: 15, exp: 2.5, tip: itemIds.arrowTips.iron, id: itemIds.arrows.iron},
    STEEL_ARROW: {level: 30, exp: 5.0, tip: itemIds.arrowTips.steel, id: itemIds.arrows.steel},
    MITHRIL_ARROW: {level: 45, exp: 7.5, tip: itemIds.arrowTips.mithril, id: itemIds.arrows.mithril},
    ADAMANT_ARROW: {level: 60, exp: 10.0, tip: itemIds.arrowTips.adamant, id: itemIds.arrows.adamant},
    RUNE_ARROW: {level: 75, exp: 12.5, tip: itemIds.arrowTips.rune, id: itemIds.arrows.rune}
};

const bows = {
    ARROW_SHAFT: {level: 1, exp: 5.0, unstrung: itemIds.arrowShaft, strung: -1},
    SHORTBOW: {level: 5, exp: 5.0, unstrung: itemIds.unstrungShortBows.normal, strung: itemIds.shortBows.normal},
    LONGBOW: {level: 10, exp: 10.0, unstrung: itemIds.unstrungLongBows.normal, strung: itemIds.longBows.normal},
    OAK_SHORTBOW: {level: 20, exp: 16.5, unstrung: itemIds.unstrungShortBows.oak, strung: itemIds.shortBows.oak},
    OAK_LONGBOW: {level: 25, exp: 25.0, unstrung: itemIds.unstrungLongBows.oak, strung: itemIds.longBows.oak},
    WILLOW_SHORTBOW: {
        level: 35,
        exp: 33.3,
        unstrung: itemIds.unstrungShortBows.willow,
        strung: itemIds.shortBows.willow
    },
    WILLOW_LONGBOW: {level: 40, exp: 41.5, unstrung: itemIds.unstrungLongBows.willow, strung: itemIds.longBows.willow},
    MAPLE_SHORTBOW: {level: 50, exp: 50.0, unstrung: itemIds.unstrungShortBows.maple, strung: itemIds.shortBows.maple},
    MAPLE_LONGBOW: {level: 55, exp: 58.3, unstrung: itemIds.unstrungLongBows.maple, strung: itemIds.longBows.maple},
    YEW_SHORTBOW: {level: 65, exp: 67.5, unstrung: itemIds.unstrungShortBows.yew, strung: itemIds.shortBows.yew},
    YEW_LONGBOW: {level: 70, exp: 75.0, unstrung: itemIds.unstrungLongBows.yew, strung: itemIds.longBows.yew},
    MAGIC_SHORTBOW: {level: 80, exp: 83.3, unstrung: itemIds.unstrungShortBows.magic, strung: itemIds.shortBows.magic},
    MAGIC_LONGBOW: {level: 85, exp: 91.5, unstrung: itemIds.unstrungLongBows.magic, strung: itemIds.longBows.magic}
};

const logs = {
    NORMAL: {logId: itemIds.logs.normal, makeableItems: [bows.SHORTBOW, bows.LONGBOW, bows.ARROW_SHAFT]},
    OAK: {logId: itemIds.logs.oak, makeableItems: [bows.OAK_SHORTBOW, bows.OAK_LONGBOW]},
    WILLOW: {logId: itemIds.logs.willow, makeableItems: [bows.WILLOW_SHORTBOW, bows.WILLOW_LONGBOW]},
    MAPLE: {logId: itemIds.logs.maple, makeableItems: [bows.MAPLE_SHORTBOW, bows.MAPLE_LONGBOW]},
    YEW: {logId: itemIds.logs.yew, makeableItems: [bows.YEW_SHORTBOW, bows.YEW_LONGBOW]},
    MAGIC: {logId: itemIds.logs.magic, makeableItems: [bows.MAGIC_SHORTBOW, bows.MAGIC_LONGBOW]}
};

const cutLogAction: itemOnItemAction = (details) => {
    const {player, usedItem, usedWithItem} = details;
    const log = usedItem.itemId !== itemIds.knife ? usedItem : usedWithItem;
    const skillInfo = Object.keys(logs).find(l => logs[l].logId === log.itemId);
    const makeableItems = logs[skillInfo].makeableItems;
    const makeableItemsInfo = [];
    makeableItems.forEach(item => makeableItemsInfo.push({
        itemId: item.unstrung,
        itemName: cache.itemDefinitions.get(item.unstrung).name
    }));
    itemSelectionAction(player, 'MAKING', makeableItemsInfo).then(choice => {
        if (!choice) {
            return;
        } else {
            const skillInfo = Object.keys(bows).find(l => (bows[l].unstrung === choice.itemId));
            const makingItem = bows[skillInfo];
            if (player.skills.values[Skill.FLETCHING].level > makingItem.level) {
                player.sendMessage(`You need a Fletching level of ${makingItem.level} to cut this.`).then(r => console.log(r));
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
                    if (elapsedTicks % 6 === 0) {
                        player.playAnimation(animationIds.cutLogAnimation);
                    }
                    if (elapsedTicks % 3 === 0) {
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
                    }
                    elapsedTicks++;
                });
            }
        }
    }).catch(error => console.log(error));
};

const attachArrowAction: itemOnItemAction = (details) => {
    const {player, usedItem, usedWithItem} = details;
    const skillInfo = Object.keys(arrows).find(l => (arrows[l].tip === usedItem.itemId && arrows[l].with === usedWithItem.itemId) || (arrows[l].tip === usedWithItem.itemId && arrows[l].with === usedItem.itemId));
    const arrow = arrows[skillInfo];
    if (player.skills.values[Skill.FLETCHING].level < arrow.level) {
        player.sendMessage(`You need a Fletching level of ${arrow.level} to attach this.`).then(r => console.log(r));
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
            player.sendMessage(`You attach the ${cache.itemDefinitions.get(tipItem).name} to the ${cache.itemDefinitions.get(withItem).name}.`).then(r => console.log(r));
            player.skills.addExp(Skill.FLETCHING, arrow.exp * setAmount);
        }
    }
};
export default new RunePlugin([{
    type: ActionType.ITEM_ON_ITEM_ACTION,
    items: Object.keys(logs).map(log => ({item1: itemIds.knife, item2: logs[log].logId})),
    action: cutLogAction
}, {
    type: ActionType.ITEM_ON_ITEM_ACTION,
    items: Object.keys(arrows).map(arrow => ({item1: arrows[arrow].tip, item2: arrows[arrow].with})),
    action: attachArrowAction
}]);
