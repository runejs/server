import { Player } from '@engine/world/actor';
import { PacketData } from '@engine/net';

const blinkingTabClickPacket = (player: Player, packet: PacketData) => {
    const { buffer } = packet;
    const tabIndex = buffer.get('byte');

    const tabClickEventIndex = player.metadata?.tabClickEvent?.tabIndex || -1;

    if(tabClickEventIndex === tabIndex) {
        if (player.metadata.tabClickEvent) {
            player.metadata.tabClickEvent.event.next(true);
        }
    }
};

export default {
    opcode: 44,
    size: 1,
    handler: blinkingTabClickPacket
};
