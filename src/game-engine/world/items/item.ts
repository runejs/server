import { filestore } from '@engine/game-server';
import { findItem, itemMap } from '@engine/config';
import { ParentWidget, StaticItemWidget } from '@runejs/filestore';


export interface Item {
    itemId: number;
    amount: number;
}

function itemInventoryOptions(itemId: number): string[] {
    const itemDefinition = filestore.configStore.itemStore.getItem(itemId);
    if(!itemDefinition) {
        return [];
    }

    return itemDefinition.widgetOptions;
}

export const getItemOptions = (itemId: number, widget: { widgetId: number, containerId: number }): string[] => {
    const widgetDefinition = filestore.widgetStore.decodeWidget(widget.widgetId) as ParentWidget;
    if(!widgetDefinition || !widgetDefinition.children || widgetDefinition.children.length <= widget.containerId) {
        return itemInventoryOptions(itemId);
    }

    const widgetChild = widgetDefinition.children[widget.containerId] as StaticItemWidget;
    if(!widgetChild || !widgetChild.items || !widgetChild.options) {
        return itemInventoryOptions(itemId);
    }

    let hasWidgetOptions = false;
    for(const option of widgetChild.options) {
        if(option) {
            hasWidgetOptions = true;
        }
    }

    if(!hasWidgetOptions) {
        return itemInventoryOptions(itemId);
    }

    return widgetChild.options;
};

export const getItemOption = (itemId: number, optionNumber: number, widget: { widgetId: number, containerId: number }): string => {
    const optionIndex = optionNumber - 1;
    const options = getItemOptions(itemId, widget);
    let option = 'option-' + optionNumber;

    if(options && options.length >= optionNumber) {
        if(options[optionIndex] !== null && options[optionIndex].toLowerCase() !== 'hidden') {
            option = options[optionIndex].toLowerCase();
        }
    }

    option = option.replace(/ /g, '-')
    if(['wield','wear','equip'].find((s) => s === option)){
        option = 'equip';
    }
    return option;
};

export function parseItemId(item: number | Item): number {
    return (typeof item !== 'number' ? item.itemId : item);
}

export function toNote(item: number | Item): number {
    item = parseItemId(item);
    let notedItem = Object.values(itemMap).find(i => i.bankNoteId === item);

    if (!notedItem) {
        const fallbackNote = findItem(item + 1);
        if (fallbackNote?.bankNoteId === item) {
            notedItem = fallbackNote;
        }
    }

    return !notedItem ? -1 : notedItem.gameId;
}

export function fromNote(item: number | Item): number {
    item = parseItemId(item);
    const notedItem = findItem(item);
    return !notedItem ? -1 : notedItem.bankNoteId;
}
