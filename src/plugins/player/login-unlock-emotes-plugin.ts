import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { playerInitAction } from '@server/world/actor/player/player';
import { unlockEmotes } from '@server/plugins/buttons/player-emotes-plugin';

export const action: playerInitAction = (details) => {
    const { player } = details;

    unlockEmotes(player);
};

export default new RunePlugin({ type: ActionType.PLAYER_INIT, action });
