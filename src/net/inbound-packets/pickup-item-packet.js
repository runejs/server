import { Position } from '../../world/position';
import { actionHandler } from '../../world/action';

const pickupItemPacket = (player, packet) => {
    const { buffer } = packet;
    const y = buffer.get('SHORT', 'UNSIGNED');
    const itemId = buffer.get('SHORT', 'UNSIGNED');
    const x = buffer.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');

    const level = player.position.level;
    const worldItemPosition = new Position(x, y, level);

    const worldMods = player.instance.getInstancedChunk(worldItemPosition);
    const worldItems = worldMods?.mods?.get(worldItemPosition.key)?.worldItems || [];
    const worldItem = worldItems.find(i => i.itemId === itemId) || null;

    if(worldItem && !worldItem.removed) {
        if(worldItem.owner && !worldItem.owner.equals(player)) {
            return;
        }

        actionHandler.call('world_item_action', player, worldItem, 'pick-up');
    }
};

export default {
    opcode: 85,
    size: 6,
    handler: pickupItemPacket
};
