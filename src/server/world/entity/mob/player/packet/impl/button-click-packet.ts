import { incomingPacket } from '../incoming-packet';
import { Player } from '../../player';
import { RsBuffer } from '../../../../../../net/rs-buffer';

export const buttonClickPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    const buttonId = packet.readShortBE();

    if(buttonId === 2458) {
        player.logout();
    } else {
        console.log(`Unhandled button ${buttonId} clicked.`);
    }
};
