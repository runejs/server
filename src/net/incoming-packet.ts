import { Player } from '../world/actor/player/player';
import { ByteBuffer } from '@runejs/byte-buffer';

export type incomingPacket = (player: Player, packetId: number, packetSize: number, buffer: ByteBuffer) => void;
