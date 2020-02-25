import { incomingPacket } from '../incoming-packet';
import { Player } from '../../player';
import { RsBuffer } from '@server/net/rs-buffer';
import { buttonAction } from '@server/world/mob/player/action/button-action';

const ignoreButtons: string[] = [
    '269:99' // character design accept button
];

export const buttonClickPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    const widgetId = packet.readShortBE();
    const buttonId = packet.readShortBE();

    if(ignoreButtons.indexOf(`${widgetId}:${buttonId}`) === -1) {
        buttonAction(player, widgetId, buttonId);
    }
};
