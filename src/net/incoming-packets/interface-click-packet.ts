import { incomingPacket } from '../incoming-packet';
import { Player } from '../../world/actor/player/player';
import { RsBuffer } from '@server/net/rs-buffer';

export const interfaceClickPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    // Do nothing
};
