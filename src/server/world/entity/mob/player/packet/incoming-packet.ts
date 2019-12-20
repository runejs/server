import { RsBuffer } from '../../../../../net/rs-buffer';
import { Player } from '../player';

export abstract class IncomingPacket {

    protected readonly player: Player;
    protected readonly packetId: number;
    protected readonly packetSize: number;
    protected readonly packet: RsBuffer;

    public constructor(player: Player, packetId: number, packetSize: number, buffer: Buffer) {
        this.player = player;
        this.packetId = packetId;
        this.packetSize = packetSize;
        this.packet = new RsBuffer(buffer);
    }

    public abstract handle(): void;

}
