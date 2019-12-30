import { RsBuffer } from './rs-buffer';
import { Isaac } from './isaac';

/**
 * The type of packet; Fixed, Dynamic Small (sized byte), or Dynamic Large (sized short)
 */
export enum PacketType {
    FIXED = 'FIXED',
    DYNAMIC_SMALL = 'DYNAMIC_SMALL',
    DYNAMIC_LARGE = 'DYNAMIC_LARGE'
}

/**
 * A single packet to be sent to the game client.
 */
export class Packet extends RsBuffer {

    private readonly _packetId: number;
    private readonly _type: PacketType = PacketType.FIXED;

    public constructor(packetId: number, type: PacketType = PacketType.FIXED, allocatedSize: number = 5000) {
        super(Buffer.alloc(allocatedSize));
        this._packetId = packetId;
        this._type = type;
    }

    public toBuffer(cipher: Isaac): Buffer {
        const packetSize = this.getWriterIndex();
        let bufferSize = packetSize + 1; // +1 for the packet id

        if(this.type !== PacketType.FIXED) {
            bufferSize += this.type === PacketType.DYNAMIC_SMALL ? 1 : 2;
        }

        const buffer = RsBuffer.create(bufferSize);
        buffer.writeUnsignedByte((this.packetId + (cipher !== null ? cipher.rand() : 0)) & 0xff);

        let copyStart = 1;

        if(this.type === PacketType.DYNAMIC_SMALL) {
            buffer.writeUnsignedByte(packetSize);
            copyStart = 2;
        } else if(this.type === PacketType.DYNAMIC_LARGE) {
            buffer.writeShortBE(packetSize);
            copyStart = 3;
        }

        this.getBuffer().copy(buffer.getBuffer(), copyStart, 0, packetSize);
        return buffer.getBuffer();
    }

    get packetId(): number {
        return this._packetId;
    }

    get type(): PacketType {
        return this._type;
    }
}
