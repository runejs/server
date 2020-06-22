import { world } from '@server/game-server';
import { Position } from '@server/world/position';
import { worldItemAction } from '@server/world/actor/player/action/world-item-action';

const pickupItemPacket = (player, packet) => {
    const { buffer } = packet;
    const y = buffer.get('SHORT', 'UNSIGNED');
    const itemId = buffer.get('SHORT', 'UNSIGNED');
    const x = buffer.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');

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

export default {
    opcode: 85,
    size: 6,
    handler: pickupItemPacket
};
