import { incomingPacket } from '../incoming-packet';
import { ByteBuffer } from '@runejs/byte-buffer';
import { Player } from '../../world/actor/player/player';
import { buttonAction } from '@server/world/actor/player/action/button-action';

const ignoreButtons: string[] = [
    '269:99' // character design accept button
];

export const buttonClickPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: ByteBuffer): void => {
    const widgetId = packet.get('SHORT');
    const buttonId = packet.get('SHORT');

    if(ignoreButtons.indexOf(`${widgetId}:${buttonId}`) === -1) {
        buttonAction(player, widgetId, buttonId);
    }
};
