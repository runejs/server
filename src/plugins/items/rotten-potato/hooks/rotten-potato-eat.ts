import { itemInteractionActionHandler } from '@engine/action/pipe/item-interaction.action';
import { dialogue, execute } from '@engine/world/actor/dialogue';

enum DialogueOption {
    SET_ALL_STATS,
    WIPE_INVENTORY,
    SETUP_POH,
    TELEPORT_TO_PLAYER,
    SPAWN_AGGRESSIVE_NPC
}

const eatPotato: itemInteractionActionHandler = async (details) => {

    let chosenOption: DialogueOption;

    await dialogue([details.player], [
        options => [
            `Set all stats`, [
                execute(() => chosenOption = DialogueOption.SET_ALL_STATS)
            ],
            `Wipe inventory`, [
                execute(() => chosenOption = DialogueOption.WIPE_INVENTORY)
            ],
            `Setup POH`, [
                execute(() => chosenOption = DialogueOption.SETUP_POH)
            ],
            `Teleport to player`, [
                execute(() => chosenOption = DialogueOption.TELEPORT_TO_PLAYER)
            ],
            `Spawn aggressive NPC`, [
                execute(() => chosenOption = DialogueOption.SPAWN_AGGRESSIVE_NPC)
            ],
        ]
    ]);
    switch (chosenOption) {
        case DialogueOption.SET_ALL_STATS:
            break;
        case DialogueOption.TELEPORT_TO_PLAYER:
            break;
        default:
            break;
    }

};

export default eatPotato;
