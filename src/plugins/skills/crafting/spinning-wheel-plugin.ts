import { objectAction } from '@server/world/actor/player/action/object-action';
import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { buttonAction, ButtonActionDetails } from '@server/world/actor/player/action/button-action';
import { soundIds } from '@server/world/config/sound-ids';
import { Subscription } from 'rxjs';
import { itemIds } from '@server/world/config/item-ids';
import { loopingAction } from '@server/world/actor/player/action/action';
import { Skill } from '@server/world/actor/skills';
import { cache } from '@server/game-server';
import { widgets } from '@server/world/config/widget';
import { animationIds } from '@server/world/config/animation-ids';
import { objectIds } from '@server/world/config/object-ids';

interface Spinnable {
    input: number | number[];
    output: number;
    experience: number;
    requiredLevel: number;
}

interface SpinnableButton {
    shouldTakeInput: boolean;
    count: number;
    spinnable: Spinnable;
}

const ballOfWool: Spinnable = {input: itemIds.wool, output: itemIds.ballOfWool, experience: 2.5, requiredLevel: 1};
const bowString: Spinnable = {input: itemIds.flax, output: itemIds.bowstring, experience: 15, requiredLevel: 10};
const rootsCbowString: Spinnable = {
    input: [
        itemIds.oakRoots,
        itemIds.willowRoots,
        itemIds.mapleRoots,
        itemIds.yewRoots
    ],
    output: itemIds.crossbowString,
    experience: 15,
    requiredLevel: 10
};
const sinewCbowString: Spinnable = {
    input: itemIds.sinew,
    output: itemIds.crossbowString,
    experience: 15,
    requiredLevel: 10
};
const magicAmuletString: Spinnable = {
    input: itemIds.magicRoots,
    output: itemIds.magicString,
    experience: 30,
    requiredLevel: 19
};
const widgetButtonIds: Map<number, SpinnableButton> = new Map<number, SpinnableButton>([
    [100, {shouldTakeInput: false, count: 1, spinnable: ballOfWool}],
    [99, {shouldTakeInput: false, count: 5, spinnable: ballOfWool}],
    [98, {shouldTakeInput: false, count: 10, spinnable: ballOfWool}],
    [97, {shouldTakeInput: true, count: 0, spinnable: ballOfWool}],
    [95, {shouldTakeInput: false, count: 1, spinnable: bowString}],
    [94, {shouldTakeInput: false, count: 5, spinnable: bowString}],
    [93, {shouldTakeInput: false, count: 10, spinnable: bowString}],
    [91, {shouldTakeInput: true, count: 0, spinnable: bowString}],
    [107, {shouldTakeInput: false, count: 1, spinnable: magicAmuletString}],
    [106, {shouldTakeInput: false, count: 5, spinnable: magicAmuletString}],
    [105, {shouldTakeInput: false, count: 10, spinnable: magicAmuletString}],
    [104, {shouldTakeInput: true, count: 0, spinnable: magicAmuletString}],
    [121, {shouldTakeInput: false, count: 1, spinnable: rootsCbowString}],
    [120, {shouldTakeInput: false, count: 5, spinnable: rootsCbowString}],
    [119, {shouldTakeInput: false, count: 10, spinnable: rootsCbowString}],
    [118, {shouldTakeInput: true, count: 0, spinnable: rootsCbowString}],
    [114, {shouldTakeInput: false, count: 1, spinnable: sinewCbowString}],
    [113, {shouldTakeInput: false, count: 5, spinnable: sinewCbowString}],
    [112, {shouldTakeInput: false, count: 10, spinnable: sinewCbowString}],
    [111, {shouldTakeInput: true, count: 0, spinnable: sinewCbowString}],
]);

export const openSpinningInterface: objectAction = (details) => {
    details.player.activeWidget = {
        widgetId: widgets.whatWouldYouLikeToSpin,
        type: 'SCREEN',
        closeOnWalk: true
    };
};

const spinProduct: any = (details: ButtonActionDetails, spinnable: Spinnable, count: number) => {
    let elapsedTicks = 0;

    let created = 0;

    // As an multiple items can be used for one of the recipes, check if its an array
    let currentItem: number;
    let currentItemIndex: number = 0;
    let isArray = false;
    if (Array.isArray(spinnable.input)) {
        isArray = true;
        currentItem = spinnable.input[0];
    } else {
        currentItem = spinnable.input;
    }
    // Create a new tick loop
    const loop = loopingAction({ player: details.player });
    loop.event.subscribe(() => {
        if (created === count) {
            loop.cancel();
            return;
        }
        // Check if out of input material
        if (!details.player.hasItemInInventory(currentItem)) {
            let cancel = false;
            if (isArray) {
                if (currentItemIndex < (<number[]> spinnable.input).length) {
                    currentItemIndex++;
                    currentItem = (<number[]> spinnable.input)[currentItemIndex];
                } else {
                    cancel = true;
                }
            } else {
                cancel = true;
            }
            if (cancel) {
                details.player.sendMessage(`You don't have any ${cache.itemDefinitions.get(currentItem).name.toLowerCase()}.`);
                loop.cancel();
                return;
            }
        }
        // Spinning takes 3 ticks for each item
        if (elapsedTicks % 3 === 0) {
            details.player.removeFirstItem(currentItem);
            details.player.giveItem(spinnable.output);
            details.player.skills.addExp(Skill.CRAFTING, spinnable.experience);
            created++;
        }
        // animation plays once every two items
        if (elapsedTicks % 6 === 0) {
            details.player.playAnimation(animationIds.spinSpinningWheel);
            details.player.outgoingPackets.playSound(soundIds.spinWool, 5);
        }

        elapsedTicks++;
    });
};

export const buttonClicked: buttonAction = (details) => {
    // Check if player might be spawning widget clientside
    if (!details.player.activeWidget || !(details.player.activeWidget.widgetId === 459)) {
        return;
    }
    const product = widgetButtonIds.get(details.buttonId);

    // Close the widget as it is no longer needed
    details.player.closeActiveWidgets();

    if (!details.player.skills.hasLevel(Skill.CRAFTING, product.spinnable.requiredLevel)) {
        details.player.sendMessage(`You need a crafting level of ${product.spinnable.requiredLevel} to craft ${cache.itemDefinitions.get(product.spinnable.output).name.toLowerCase()}.`, true);
        return;
    }

    if (!product.shouldTakeInput) {
        // If the player has not chosen make X, we dont need to get input and can just start the crafting
        spinProduct(details, product.spinnable, product.count);
    } else {
        let numericInputSpinSub: Subscription;
        let actionCancelledSpinSub: Subscription;
        // We should prepare for a number to be sent from the client
        numericInputSpinSub = details.player.numericInputEvent.subscribe((number) => {
            actionCancelledSpinSub.unsubscribe();
            numericInputSpinSub.unsubscribe();
            // When a number is recieved we can start crafting the product
            spinProduct(details, product.spinnable, number);
        });
        // If the player moves or cancels the number input, we do not want to wait for input, as they could be depositing
        // items into their bank.
        actionCancelledSpinSub = details.player.actionsCancelled.subscribe(() => {
            actionCancelledSpinSub.unsubscribe();
            numericInputSpinSub.unsubscribe();
        });
        // Ask the player to enter how many they want to create
        details.player.outgoingPackets.showNumberInputDialogue();
    }


};

export default new RunePlugin([
        {
            type: ActionType.OBJECT_ACTION,
            objectIds: objectIds.spinningWheel,
            options: ['spin'],
            walkTo: true,
            action: openSpinningInterface
        },
        {
            type: ActionType.BUTTON,
            widgetId: widgets.whatWouldYouLikeToSpin,
            buttonIds: Array.from(widgetButtonIds.keys()),
            action: buttonClicked
        }
    ]
);
