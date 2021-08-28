import { Player } from '../../world/actor/player/player';

export default {
    opcode: 176,
    size: 0,
    handler: (player: Player) => player.interfaceState.closeAllSlots()
};
