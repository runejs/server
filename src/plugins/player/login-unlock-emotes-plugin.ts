import { playerInitAction } from '@engine/world/actor/player/player';
import { unlockEmotes } from '@plugins/buttons/player-emotes-plugin';

export const action: playerInitAction = (details) => {
    const { player } = details;
    unlockEmotes(player);
};

export default { type: 'player_init', action };
