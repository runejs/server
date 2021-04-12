import { Position } from '../../world/position';

const pickupItemPacket = (player, packet) => {
    const { buffer } = packet;
    const y = buffer.get('short', 'u');
    const itemId = buffer.get('short', 'u');
    const x = buffer.get('short', 'u', 'le');

    const level = player.position.level;
    const worldItemPosition = new Position(x, y, level);

    const worldMods = player.instance.getInstancedChunk(worldItemPosition);
    const worldItems = worldMods?.mods?.get(worldItemPosition.key)?.worldItems || [];

    let worldItem = worldItems.find(i => i.itemId === itemId) || null;

    if(!worldItem) {
        const personalMods = player.personalInstance.getInstancedChunk(worldItemPosition);
        const personalItems = personalMods?.mods?.get(worldItemPosition.key)?.worldItems || [];
        worldItem = personalItems.find(i => i.itemId === itemId) || null;
    }

    if(worldItem && !worldItem.removed) {
        if(worldItem.owner && !worldItem.owner.equals(player)) {
            return;
        }

        player.actionPipeline.call('spawned_item_interaction', player, worldItem, 'pick-up');
    }
};

export default {
    opcode: 85,
    size: 6,
    handler: pickupItemPacket
};
