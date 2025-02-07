import { buttonActionHandler } from '@engine/action/pipe/button.action';
import { objectInteractionActionHandler } from '@engine/action/pipe/object-interaction.action';
import { findItem, widgets } from '@engine/config/config-handler';
import { ContentPlugin } from '@engine/plugins/plugin.types';
import { Player } from '@engine/world/actor/player/player';
import { Skill } from '@engine/world/actor/skills';
import { QueueType } from '@engine/world/actor/tick-queue';
import { animationIds } from '@engine/world/config/animation-ids';
import { itemIds } from '@engine/world/config/item-ids';
import { objectIds } from '@engine/world/config/object-ids';
import { soundIds } from '@engine/world/config/sound-ids';
import { logger } from '@runejs/common';
import { take } from 'rxjs/operators';

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

const ballOfWool: Spinnable = {
    input: itemIds.wool,
    output: itemIds.ballOfWool,
    experience: 2.5,
    requiredLevel: 1,
};
const bowString: Spinnable = {
    input: itemIds.flax,
    output: itemIds.bowstring,
    experience: 15,
    requiredLevel: 10,
};
const rootsCbowString: Spinnable = {
    input: [itemIds.roots.oak, itemIds.roots.willow, itemIds.roots.maple, itemIds.roots.yew],
    output: itemIds.crossbowString,
    experience: 15,
    requiredLevel: 10,
};
const sinewCbowString: Spinnable = {
    input: itemIds.sinew,
    output: itemIds.crossbowString,
    experience: 15,
    requiredLevel: 10,
};
const magicAmuletString: Spinnable = {
    input: itemIds.roots.magic,
    output: itemIds.magicString,
    experience: 30,
    requiredLevel: 19,
};
const widgetButtonIds: Map<number, SpinnableButton> = new Map<number, SpinnableButton>([
    [100, { shouldTakeInput: false, count: 1, spinnable: ballOfWool }],
    [99, { shouldTakeInput: false, count: 5, spinnable: ballOfWool }],
    [98, { shouldTakeInput: false, count: 10, spinnable: ballOfWool }],
    [97, { shouldTakeInput: true, count: 0, spinnable: ballOfWool }],
    [95, { shouldTakeInput: false, count: 1, spinnable: bowString }],
    [94, { shouldTakeInput: false, count: 5, spinnable: bowString }],
    [93, { shouldTakeInput: false, count: 10, spinnable: bowString }],
    [91, { shouldTakeInput: true, count: 0, spinnable: bowString }],
    [107, { shouldTakeInput: false, count: 1, spinnable: magicAmuletString }],
    [106, { shouldTakeInput: false, count: 5, spinnable: magicAmuletString }],
    [105, { shouldTakeInput: false, count: 10, spinnable: magicAmuletString }],
    [104, { shouldTakeInput: true, count: 0, spinnable: magicAmuletString }],
    [121, { shouldTakeInput: false, count: 1, spinnable: rootsCbowString }],
    [120, { shouldTakeInput: false, count: 5, spinnable: rootsCbowString }],
    [119, { shouldTakeInput: false, count: 10, spinnable: rootsCbowString }],
    [118, { shouldTakeInput: true, count: 0, spinnable: rootsCbowString }],
    [114, { shouldTakeInput: false, count: 1, spinnable: sinewCbowString }],
    [113, { shouldTakeInput: false, count: 5, spinnable: sinewCbowString }],
    [112, { shouldTakeInput: false, count: 10, spinnable: sinewCbowString }],
    [111, { shouldTakeInput: true, count: 0, spinnable: sinewCbowString }],
]);

export const openSpinningInterface: objectInteractionActionHandler = details => {
    details.player.interfaceState.openWidget(widgets.whatWouldYouLikeToSpin, {
        slot: 'screen',
    });
};

function processSpin(player: Player, spinnable: Spinnable): boolean {
    let currentItem: number;
    let currentItemIndex = 0;

    // Determine current input item
    if (Array.isArray(spinnable.input)) {
        currentItem = spinnable.input[currentItemIndex];
    } else {
        currentItem = spinnable.input;
    }

    // Check if out of input material
    if (!player.hasItemInInventory(currentItem)) {
        if (Array.isArray(spinnable.input) && currentItemIndex < spinnable.input.length - 1) {
            currentItemIndex++;
            currentItem = spinnable.input[currentItemIndex];
        } else {
            const itemName = findItem(currentItem)?.name || '';
            player.sendMessage(`You don't have any ${itemName.toLowerCase()}.`);
            return false;
        }
    }

    // Process the spinning action
    player.removeFirstItem(currentItem);
    player.giveItem(spinnable.output);
    player.skills.addExp(Skill.CRAFTING, spinnable.experience);

    return true;
}
async function spinProduct(player: Player, spinnable: Spinnable, count: number): Promise<void> {
    // Early exit if count is 0
    if (count <= 0) {
        return;
    }

    try {
        for (let i = 0; i < count; i++) {
            // Queue as WEAK task
            await player.tickQueue.requestTicks({
                ticks: i === 0 ? 0 : 3, // First action immediate, then 3 tick spacing
                type: QueueType.WEAK,
            });

            // Play animation and sound each time
            player.playAnimation(animationIds.spinSpinningWheel);
            player.playSound(soundIds.spinWool, 5);

            // Process the spin
            if (!processSpin(player, spinnable)) {
                break;
            }
        }
    } catch (error) {
        // Queue was interrupted (movement/combat/etc)
        player.sendMessage(`Spinning interrupted: ${error}`);
    }
}

export const buttonClicked: buttonActionHandler = async details => {
    // Check if player might be spawning widget clientside
    if (!details.player.interfaceState.findWidget(459)) {
        return;
    }

    const product = widgetButtonIds.get(details.buttonId);
    if (!product) {
        logger.error(`Unhandled button id ${details.buttonId} for buttonClicked in spinning wheel.`);
        return;
    }

    // Close the widget as it is no longer needed
    details.player.interfaceState.closeAllSlots();

    // Check crafting level requirement
    if (!details.player.skills.hasLevel(Skill.CRAFTING, product.spinnable.requiredLevel)) {
        const outputName = findItem(product.spinnable.output)?.name || '';
        details.player.sendMessage(
            `You need a crafting level of ${product.spinnable.requiredLevel} to craft ${outputName.toLowerCase()}.`,
            true,
        );
        return;
    }

    if (!product.shouldTakeInput) {
        // Start spinning with predefined count using WEAK queue
        await spinProduct(details.player, product.spinnable, product.count);
    } else {
        // Handle "Make X" option
        try {
            const amount = await new Promise<number>((resolve, reject) => {
                const numericInputSub = details.player.numericInputEvent.subscribe(number => {
                    numericInputSub.unsubscribe();
                    resolve(number);
                });

                details.player.actionsCancelled.pipe(take(1)).subscribe(() => {
                    numericInputSub.unsubscribe();
                    reject('Action cancelled');
                });

                details.player.outgoingPackets.showNumberInputDialogue();
            });

            await spinProduct(details.player, product.spinnable, amount);
        } catch (error) {
            // Handle cancellation
            details.player.sendMessage(error);
        }
    }
};

export default (<ContentPlugin>{
    pluginId: 'rs:spinning_wheel',
    hooks: [
        {
            type: 'object_interaction',
            objectIds: objectIds.spinningWheel,
            options: ['spin'],
            handler: openSpinningInterface,
            walkTo: true,
        },
        {
            type: 'button',
            widgetId: widgets.whatWouldYouLikeToSpin,
            buttonIds: Array.from(widgetButtonIds.keys()),
            handler: buttonClicked,
        },
    ],
});
