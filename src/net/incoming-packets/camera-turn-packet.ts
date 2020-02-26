import { incomingPacket } from '../incoming-packet';
import { Player } from '../../world/actor/player/player';
import { RsBuffer } from '@server/net/rs-buffer';

export const cameraTurnPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    // Do nothing
};
