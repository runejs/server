import { incomingPacket } from '../incoming-packet';
import { Player } from '../../player';
import { RsBuffer } from '@server/net/rs-buffer';
import { buttonAction } from '@server/world/mob/player/action/button-action';

const ignoreButtons: number[] = [
    3651 // character design accept button
];

export const buttonClickPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    const buttonId = packet.readShortBE();

    if(ignoreButtons.indexOf(buttonId) === -1) {
        buttonAction(player, buttonId);
    }
};
