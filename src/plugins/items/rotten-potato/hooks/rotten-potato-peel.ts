import { itemInteractionActionHandler } from '@engine/action/pipe/item-interaction.action';
import { Player } from '@engine/world/actor/player/player';
import { dialogue, execute } from '@engine/world/actor/dialogue';
import { getActionHooks } from '@engine/action/hook';
import { advancedNumberHookFilter } from '@engine/action/hook/hook-filters';
import { ObjectInteractionActionHook } from '@engine/action/pipe/object-interaction.action';
import { objectIds } from '@engine/world/config/object-ids';
import { openTravel } from '@plugins/items/rotten-potato/helpers/rotten-potato-travel';


function openBank(player: Player) {
    const interactionActions = getActionHooks<ObjectInteractionActionHook>('object_interaction')
        .filter(plugin => advancedNumberHookFilter(plugin.objectIds, objectIds.bankBooth, plugin.options, 'use-quickly'));
    interactionActions.forEach(plugin => {
        if (!plugin.handler) {
            return;
        }

        plugin.handler({
            player: player,
            object: {
                objectId: objectIds.bankBooth,
                level: player.position.level,
                x: player.position.x,
                y: player.position.y,
                orientation: 0,
                type: 0
            },
            option: 'use-quickly',
            position: player.position,
            objectConfig: undefined as any,
            cacheOriginal: undefined as any
        })
    });
}

enum DialogueOption {
    BANK,
    TELEPORT_MENU,
    TELEPORT_TO_RARE_DROP,
    FORCE_RARE_DROP
}

const peelPotato: itemInteractionActionHandler = async (details) => {

    let chosenOption: DialogueOption;
    // console.log(world.travelLocations.locations)
    await dialogue([details.player], [
        options => [
            `Bank menu`, [
                execute(() => chosenOption = DialogueOption.BANK)
            ],
            `Travel Far!`, [
                execute(() => chosenOption = DialogueOption.TELEPORT_MENU)
            ],
            // `Teleport to RARE!`, [
            //     execute(() => chosenOption = DialogueOption.TELEPORT_TO_RARE_DROP)
            // ],
            // `Spawn RARE!`, [
            //     execute(() => chosenOption = DialogueOption.FORCE_RARE_DROP)
            // ],
        ]
    ]);

    // using ! here because we have just set it in the dialogue
    switch (chosenOption!) {
        case DialogueOption.BANK:
            openBank(details.player);
            break;
        case DialogueOption.TELEPORT_MENU:
            openTravel(details.player, 1);
            break;
        default:
            break;
    }

};

export default peelPotato;
