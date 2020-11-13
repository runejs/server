import { Player } from '@server/world/actor/player/player';

export function checkForGemBoost(player: Player): number {
    if (player.isItemEquipped(1706) ||
        player.isItemEquipped(1708) ||
        player.isItemEquipped(1710) ||
        player.isItemEquipped(1712)) {
        return 86;
    }
    return 256;
}
