import { incomingPacket } from '../incoming-packet';
import { Player } from '../../world/actor/player/player';
import { ByteBuffer } from '@runejs/byte-buffer';

export const widgetsClosedPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: ByteBuffer): void => {
    player.closeActiveWidgets(false);
};
