import { Player } from '../player';
import { IncomingPacket } from './incoming-packet';

import { InterfaceClickPacket } from './impl/interface-click-packet';
import { ButtonClickPacket } from './impl/button-click-packet';
import { WalkPacket } from './impl/walk-packet';
import { CameraTurnPacket } from './impl/camera-turn-packet';

const packets = {
    19:  InterfaceClickPacket,
    140: CameraTurnPacket,

    79:  ButtonClickPacket,

    28:  WalkPacket,
    213: WalkPacket,
    247: WalkPacket
};

export function handlePacket(player: Player, packetId: number, packetSize: number, buffer: Buffer): void {
    const packetClass = packets[packetId];

    if(!packetClass) {
        console.log(`Unknown packet ${packetId} with size ${packetSize} received.`)
        return;
    }

    (new packetClass(player, packetId, packetSize, buffer) as IncomingPacket).handle();
}
