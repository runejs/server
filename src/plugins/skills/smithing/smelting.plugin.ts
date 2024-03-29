import { objectIds } from '@engine/world/config/object-ids';
import { objectInteractionActionHandler, ObjectInteractionAction, ButtonActionHook, ObjectInteractionActionHook } from '@engine/action';
import { buttonActionHandler } from '@engine/action';
import { Skill } from '@engine/world/actor/skills';
import { colors } from '@engine/util/colors';
import { findItem, widgets } from '@engine/config/config-handler';
import { PlayerQuest } from '@engine/config/quest-config';
import { widgetButtonIds, widgetItems } from '@plugins/skills/smithing/smelting-constants';
import { SmeltingTask } from './smelting-task';
import { Bar } from '@plugins/skills/smithing/smelting-types';
import { logger } from '@runejs/common';


export const openSmeltingInterface: objectInteractionActionHandler = (details) => {
    details.player.interfaceState.openWidget(widgets.furnace.widgetId, {
        slot: 'chatbox'
    })
    loadSmeltingInterface(details);
};

// We need to tell the widget what the bars actually look like.
const loadSmeltingInterface = (details: ObjectInteractionAction) => {
    const theKnightsSwordQuest = details.player.quests.find(quest => quest.questId === 'theKnightsSword');

    // Send the items to the widget.
    widgetItems.forEach((item) => {
        details.player.outgoingPackets.setItemOnWidget(widgets.furnace.widgetId, item.slot.modelId, item.bar.barId, 125);
        if (!details.player.skills.hasLevel(Skill.SMITHING, item.bar.requiredLevel)) {
            details.player.modifyWidget(widgets.furnace.widgetId, { childId: item.slot.titleId, textColor: colors.red });
        } else {
            details.player.modifyWidget(widgets.furnace.widgetId, { childId: item.slot.titleId, textColor: colors.black });
        }


        // TODO (Jameskmonger) I don't think that this logic is correct.. it targets all items, not just those related to the quest.
        // Check if the player has completed 'The Knight's Sword' quest, even if the level is okay.
        if (Boolean(item.bar.quest) && (!theKnightsSwordQuest || theKnightsSwordQuest.complete)) {
            details.player.modifyWidget(widgets.furnace.widgetId, { childId: item.slot.titleId, textColor: colors.red });
        }
    });
};

export const buttonClicked: buttonActionHandler = (details) => {
    // Check if player might be spawning widget clientside
    // TODO - this should be handled by the engine
    if (!details.player.interfaceState.findWidget(widgets.furnace.widgetId)) {
        return;
    }

    const smeltable = widgetButtonIds.get(details.buttonId);

    // TODO (Jameskmonger) check for quest-specific items, e.g. the knights sword
    // const theKnightsSwordQuest: PlayerQuest = details.player.quests.find(quest => quest.questId === 'theKnightsSword');
    // if (bar.quest !== undefined && (theKnightsSwordQuest == undefined || theKnightsSwordQuest.complete)) {
    //     details.player.sendMessage(`You need to complete The Knight's Sword quest first.`, true);
    //     return;
    // }

    if (!smeltable) {
        details.player.sendMessage(`Could not find smeltable for button id ${details.buttonId}. Please tell a dev.`);
        return;
    }

    details.player.interfaceState.closeAllSlots();

    if (!smeltable.takesInput) {
        details.player.enqueueTask(SmeltingTask, [smeltable, smeltable.count]);
        return;
    }

    const numericInputSpinSubscription = details.player.numericInputEvent.subscribe((number) => {
        actionCancelledSpinSubscription?.unsubscribe();
        numericInputSpinSubscription?.unsubscribe();

        details.player.enqueueTask(SmeltingTask, [smeltable, number]);
    });

    const actionCancelledSpinSubscription = details.player.actionsCancelled.subscribe(() => {
        actionCancelledSpinSubscription?.unsubscribe();
        numericInputSpinSubscription?.unsubscribe();
    });

    details.player.outgoingPackets.showNumberInputDialogue();
};

export default {
    pluginId: 'rs:smelting',
    hooks: [
        {
            type: 'object_interaction',
            objectIds: [objectIds.furnace, 11666],
            options: ['smelt'],
            walkTo: true,
            handler: openSmeltingInterface
        } as ObjectInteractionActionHook,
        {
            type: 'button',
            widgetId: widgets.furnace.widgetId,
            buttonIds: Array.from(widgetButtonIds.keys()),
            handler: buttonClicked
        } as ButtonActionHook
    ]
};
