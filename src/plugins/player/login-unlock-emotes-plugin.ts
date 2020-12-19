import { playerInitAction } from '@server/world/actor/player/player';
import { unlockEmotes } from '@server/plugins/buttons/player-emotes-plugin';

export const action: playerInitAction = (details) => {
    const { player } = details;
    unlockEmotes(player);
};

export default { type: 'player_init', action };
