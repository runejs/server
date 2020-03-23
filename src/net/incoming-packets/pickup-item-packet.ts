import { incomingPacket } from '../incoming-packet';
import { Player } from '../../world/actor/player/player';
import { world } from '@server/game-server';
import { Position } from '@server/world/position';
import { worldItemAction } from '@server/world/actor/player/action/world-item-action';
import { ByteBuffer } from '@runejs/byte-buffer';

export const pickupItemPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: ByteBuffer): void => {
    const y = packet.get('SHORT', 'UNSIGNED');
    const itemId = packet.get('SHORT', 'UNSIGNED');
    const x = packet.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');

    const level = player.position.level;
    const worldItemPosition = new Position(x, y, level);
    const chunk = world.chunkManager.getChunkForWorldPosition(worldItemPosition);
    const worldItem = chunk.getWorldItem(itemId, worldItemPosition);

    if(!worldItem || worldItem.removed) {
        return;
    }

    if(worldItem.initiallyVisibleTo && !worldItem.initiallyVisibleTo.equals(player)) {
        return;
    }

    worldItemAction(player, worldItem, 'pick-up');
};
