import { incomingPacket } from '../incoming-packet';
import { Player } from '../../player';
import { RsBuffer } from '../../../../../../net/rs-buffer';

export const cameraTurnPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    // Do nothing
};
