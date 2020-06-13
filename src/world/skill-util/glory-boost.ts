import { Player } from '@server/world/actor/player/player';

export function checkForGemBoost(player: Player): number {
    if (player.hasItemInEquipment(1706) ||
        player.hasItemInEquipment(1708) ||
        player.hasItemInEquipment(1710) ||
        player.hasItemInEquipment(1712)) {
        return 86;
    }
    return 256;
}
