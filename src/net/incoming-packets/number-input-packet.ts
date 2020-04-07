import { incomingPacket } from '../incoming-packet';
import { Player } from '../../world/actor/player/player';
import { ByteBuffer } from '@runejs/byte-buffer';

export const numberInputPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: ByteBuffer): void => {
    const input = packet.get('INT', 'UNSIGNED');
    player.numericInputEvent.next(input);
};
