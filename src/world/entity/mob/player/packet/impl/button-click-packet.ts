import { incomingPacket } from '../incoming-packet';
import { Player } from '../../player';
import { RsBuffer } from '../../../../../../net/rs-buffer';

const ignoreButtons: number[] = [
    3651 // character design accept button
];

export const buttonClickPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    const buttonId = packet.readShortBE();

    if(buttonId === 2458) {
        player.logout();
    } else if(ignoreButtons.indexOf(buttonId) === -1) {
        console.log(`Unhandled button ${buttonId} clicked.`);
    }
};
