import { itemInteractionActionHandler } from "@engine/world/action/item-interaction.action";
import { Player } from "@engine/world/actor/player/player";
import { dialogue, execute } from "@engine/world/actor/dialogue";
import { getActionHooks } from "@engine/world/action/hooks";
import { advancedNumberHookFilter } from "@engine/world/action/hooks/hook-filters";
import { ObjectInteractionActionHook } from "@engine/world/action/object-interaction.action";
import { objectIds } from "@engine/world/config/object-ids";


function openBank(player: Player) {
    let interactionActions = getActionHooks<ObjectInteractionActionHook>('object_interaction')
        .filter(plugin => advancedNumberHookFilter(plugin.objectIds, objectIds.bankBooth, plugin.options, "use-quickly"));
    interactionActions.forEach(plugin =>
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
            objectDefinition: undefined,
            option: "use-quickly",
            position: player.position,
            cacheOriginal: undefined
        }));
}

enum DialogueOption {
    BANK,
    RANDOM_EVENTS_FOR_ALL,
    TELEPORT_TO_RARE_DROP,
    FORCE_RARE_DROP
}

const peelPotato: itemInteractionActionHandler = async (details) => {

    let chosenOption: DialogueOption;

    await dialogue([details.player], [
        options => [
            `Bank menu`, [
                execute(() => chosenOption = DialogueOption.BANK)
            ],
            `AMEs for all!`, [
                execute(() => chosenOption = DialogueOption.RANDOM_EVENTS_FOR_ALL)
            ],
            `Teleport to RARE!`, [
                execute(() => chosenOption = DialogueOption.TELEPORT_TO_RARE_DROP)
            ],
            `Spawn RARE!`, [
                execute(() => chosenOption = DialogueOption.FORCE_RARE_DROP)
            ],
        ]
    ]);
    switch (chosenOption) {
        case DialogueOption.BANK:
            openBank(details.player);
            break;
        default:
            console.log("i broke")
    }

};

export default peelPotato;
