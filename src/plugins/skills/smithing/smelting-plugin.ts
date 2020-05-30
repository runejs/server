import {Item} from "@server/world/items/item";
import {itemIds} from "@server/world/config/item-ids";
import {ItemContainer} from "@server/world/items/item-container";
import {ActionType, RunePlugin} from "@server/plugins/plugin";
import {objectIds} from "@server/world/config/object-ids";
import {objectAction} from "@server/world/actor/player/action/object-action";
import {widgets} from "@server/world/config/widget";

export interface Bar {
    barId: number,
    barLevel: number,
    ingredients: Item[],
    smeltingExp: number,
}

const smeltingContainer : ItemContainer = new ItemContainer(9);

export const openSmeltingInterface: objectAction = (details) => {
    details.player.activeWidget = {
        widgetId: widgets.furnace.widgetId,
        type: 'CHAT',
        closeOnWalk: true
    };
};

const bars : Bar[] = [
    { // Bronze Bar
        barId: itemIds.bronzeBar,
        barLevel: 1,
        ingredients: [
            {itemId: itemIds.copperOre, amount: 1},
            {itemId: itemIds.tinOre, amount: 1}
        ],
        smeltingExp: 6.2,
    },
    { // Iron Bar
        barId: itemIds.ironBar,
        barLevel: 8,
        ingredients: [
            {itemId: itemIds.ironOre, amount: 1}
        ],
        smeltingExp: 12.5,
    },
]

const hasIngredients = (ingredients: Item[], inventory: ItemContainer) : boolean => {
    return false;
};

const canSmelt = (barLevel: number, playerLevel: number): boolean =>  {
    return (barLevel <= playerLevel);
};

export default new RunePlugin([
    {
        type: ActionType.OBJECT_ACTION,
        objectIds: [objectIds.furnace],
        options: ['smelt'],
        walkTo: true,
        action: openSmeltingInterface
    }
]);