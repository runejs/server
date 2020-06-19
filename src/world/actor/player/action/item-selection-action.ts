import { Player } from '@server/world/actor/player/player';

const amounts = [
    1, 5, 'X', 'All'
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

export async function itemSelectionAction(player: Player, type: 'COOKING' | 'MAKING', items: SelectableItem[]): Promise<ItemSelection> {
    let widgetId = 307;

    if(type === 'MAKING') {
        if(items.length === 1) {
            widgetId = 309;
        } else {
            if(items.length > 5) {
                throw new Error(`Too many items provided to the item selection action!`);
            }

            widgetId = (301 + items.length);
        }
    }

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

    return new Promise((resolve, reject) => {
        player.activeWidget = {
            widgetId,
            type: 'CHAT',
            closeOnWalk: true
        };

        let actionsSub = player.actionsCancelled.subscribe(() => {
            actionsSub.unsubscribe();
            reject('Pending Actions Cancelled');
        });

        const interactionSub = player.dialogueInteractionEvent.subscribe(childId => {
            if(!player.activeWidget || player.activeWidget.widgetId !== widgetId) {
                interactionSub.unsubscribe();
                actionsSub.unsubscribe();
                reject('Active Widget Mismatch');
                return;
            }

            const options = widgets[widgetId].options;

            const choiceIndex = options.findIndex(arr => arr.indexOf(childId) !== -1);

            if(choiceIndex === -1) {
                interactionSub.unsubscribe();
                actionsSub.unsubscribe();
                reject('Choice Index Not Found');
                return;
            }

            const optionIndex = options[choiceIndex].indexOf(childId);

            if(optionIndex === -1) {
                interactionSub.unsubscribe();
                actionsSub.unsubscribe();
                reject('Option Index Not Found');
                return;
            }

            const itemId = items[choiceIndex].itemId;
            let amount = amounts[optionIndex];

            if(amount === 'X') {
                actionsSub.unsubscribe();

                player.outgoingPackets.showNumberInputDialogue();

                actionsSub = player.actionsCancelled.subscribe(() => {
                    actionsSub.unsubscribe();
                    reject('Pending Actions Cancelled');
                });

                const inputSub = player.numericInputEvent.subscribe(input => {
                    inputSub.unsubscribe();
                    actionsSub.unsubscribe();
                    interactionSub.unsubscribe();

                    if(input < 1 || input > 2147483647) {
                        player.closeActiveWidgets();
                        reject('Invalid User Amount Input');
                    } else {
                        player.closeActiveWidgets();
                        resolve({itemId, amount: input} as ItemSelection);
                    }
                });
            } else {
                if (amount === 'All') {
                    amount = player.inventory.findAll(itemId).length;
                }

                actionsSub.unsubscribe();
                interactionSub.unsubscribe();
                player.closeActiveWidgets();
                resolve({itemId, amount} as ItemSelection);
            }
        });
    });
}
