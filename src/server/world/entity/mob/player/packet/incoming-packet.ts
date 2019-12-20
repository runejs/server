import { RsBuffer } from '../../../../../net/rs-buffer';
import { Player } from '../player';

export interface incomingPacket {
    (player: Player, packetId: number, packetSize: number, buffer: RsBuffer): void;
}
