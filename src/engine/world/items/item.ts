import { filestore } from '@server/game/game-server';
import { findItem, itemMap, widgets } from '@engine/config/config-handler';
import { ParentWidget, StaticItemWidget, WidgetBase } from '@runejs/filestore';


export interface Item {
    itemId: number;
    amount: number;
}

function itemInventoryOptions(itemId: number): string[] {
    const itemDefinition = filestore.configStore.itemStore.getItem(itemId);
    if(!itemDefinition) {
        return [];
    }

    return itemDefinition.widgetOptions || [];
}
// TODO: Move to the filestore
function IsParentWidget(widget: WidgetBase): widget is ParentWidget {
    return 'children' in widget;
}

// TODO: Move to the filestore
function IsStaticItemWidget(widget: WidgetBase): widget is StaticItemWidget {
    return 'items' in widget;
}

export const getItemOptions = (itemId: number, widget: { widgetId: number, containerId: number }): string[] => {
    const widgetDefinition = filestore.widgetStore.decodeWidget(widget.widgetId) as WidgetBase;

    if (widget.widgetId === widgets.inventory.widgetId) {
        return itemInventoryOptions(itemId);
    }

    let optionsWidget: StaticItemWidget | null = null;
    if (IsStaticItemWidget(widgetDefinition) && widgetDefinition.options && !widget.containerId) {
        optionsWidget = widgetDefinition;
    }

    if (IsParentWidget(widgetDefinition)) {
        const widgetChild = widgetDefinition.children[widget.containerId];
        if (IsStaticItemWidget(widgetChild)) {
            optionsWidget = widgetChild
        }
    }

    if (!optionsWidget || !optionsWidget.items || !optionsWidget.options) {
        return itemInventoryOptions(itemId);
    }

    return optionsWidget.options;
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
