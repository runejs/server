import { Player } from '@server/world/actor/player/player';

const amounts = [
    1, 5, 10, 0
];

const widgets = {
    // 303-306 - what would you like to make?
    303: {
        items: [ 2, 3 ],
        text: [ 7, 11 ],
        options: [ [ 7, 6, 5, 4 ], [ 11, 10, 9, 8 ] ]
    },
    304: {
        items: [ 2, 3, 4 ],
        text: [ 8, 12, 16 ],
        options: [ [ 8, 7, 6, 5 ], [ 12, 11, 10, 9 ], [ 16, 15, 14, 13 ] ]
    },
    305: {
        items: [ 2, 3, 4, 5 ],
        text: [ 9, 13, 17, 21 ],
        options: [ [ 9, 8, 7, 6 ], [ 13, 12, 11, 10 ], [ 17, 16, 15, 14 ], [ 21, 20, 19, 18 ] ]
    },
    306: {
        items: [ 2, 3, 4, 5, 6 ],
        text: [ 10, 14, 18, 22, 26 ],
        options: [ [ 10, 9, 8, 7 ], [ 14, 13, 12, 11 ], [ 18, 17, 16, 15 ], [ 22, 21, 20, 19 ], [ 26, 25, 24, 23 ] ]
    },
    307: { // 307 - how many would you like to cook?
        items: [ 2 ],
        text: [ 6 ],
        options: [ [ 6, 5, 4, 3 ] ]
    },
    309: { // 309 - how many would you like to make?
        items: [ 2 ],
        text: [ 6 ],
        options: [ [ 6, 5, 4, 3 ] ]
    }
};

export interface SelectableItem {
    itemId: number;
    itemName: string;
    offset?: number;
    zoom?: number;
}

export interface ItemSelection {
    itemId: number;
    amount: number;
}

// @TODO Make-X
export const itemSelectionAction = (player: Player, type: 'COOKING' | 'MAKING', items: SelectableItem[]): Promise<ItemSelection> => {
    let widgetId = 307;

    if(type === 'MAKING') {
        if(items.length === 1) {
            widgetId = 309;
        } else {
            if(items.length > 5) {
                throw `Too many items provided to the item selection action!`;
            }

            widgetId = (301 + items.length);
        }
    }

    return new Promise((resolve, reject) => {
        const childIds = widgets[widgetId].items;
        childIds.forEach((childId, index) => {
            const itemInfo = items[index];

            if(itemInfo.offset === undefined) {
                itemInfo.offset = -12;
            }

            if(itemInfo.zoom === undefined) {
                itemInfo.zoom = 180;
            }

            player.outgoingPackets.setItemOnWidget(widgetId, childId, itemInfo.itemId, itemInfo.zoom);
            player.outgoingPackets.moveWidgetChild(widgetId, childId, 0, itemInfo.offset);
            player.outgoingPackets.updateWidgetString(widgetId, widgets[widgetId].text[index], '\\n\\n\\n\\n' + itemInfo.itemName);
        });

        player.activeWidget = {
            widgetId,
            type: 'CHAT',
            closeOnWalk: false
        };

        const actionsSub = player.actionsCancelled.subscribe(() => {
            actionsSub.unsubscribe();
            reject();
        });

        const interactionSub = player.dialogueInteractionEvent.subscribe(childId => {
            const options = widgets[widgetId].options;

            console.log(childId);

            const choiceIndex = options.findIndex(arr => arr.indexOf(childId) !== -1);

            if(choiceIndex === -1) {
                interactionSub.unsubscribe();
                reject();
                return;
            }

            const optionIndex = options[choiceIndex].indexOf(childId);

            if(optionIndex === -1) {
                interactionSub.unsubscribe();
                reject();
                return;
            }

            const itemId = items[choiceIndex].itemId;
            const amount = amounts[optionIndex];

            interactionSub.unsubscribe();
            resolve({ itemId, amount } as ItemSelection);
        });
    });
};
