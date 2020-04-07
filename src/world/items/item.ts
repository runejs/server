import { cache } from '@server/game-server';

export interface Item {
    itemId: number;
    amount: number;
}

function itemInventoryOptions(itemId: number): string[] {
    const itemDefinition = cache.itemDefinitions.get(itemId);
    if(!itemDefinition) {
        return [];
    }

    return itemDefinition.inventoryOptions;
}

export const getItemOptions = (itemId: number, widget: { widgetId: number, containerId: number }): string[] => {
    const widgetDefinition = cache.widgets.get(widget.widgetId);
    if(!widgetDefinition || !widgetDefinition.children || widgetDefinition.children.length <= widget.containerId) {
        return itemInventoryOptions(itemId);
    }

    const widgetChild = widgetDefinition.children[widget.containerId];
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

    return option.replace(/ /g, '-');
};
