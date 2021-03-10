import { Isaac } from './isaac';
import { ByteBuffer } from '@runejs/core';

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
export class Packet extends ByteBuffer {

    private readonly _packetId: number;
    private readonly _type: PacketType = PacketType.FIXED;

    public constructor(packetId: number, type: PacketType = PacketType.FIXED, allocatedSize: number = 5000) {
        super(allocatedSize);
        this._packetId = packetId;
        this._type = type;
    }

    public toBuffer(cipher: Isaac): Buffer {
        const packetSize = this.writerIndex;
        let bufferSize = packetSize + 1; // +1 for the packet id

        if(this.type !== PacketType.FIXED) {
            bufferSize += this.type === PacketType.DYNAMIC_SMALL ? 1 : 2;
        }

        const buffer = new ByteBuffer(bufferSize);
        buffer.put((this.packetId + (cipher !== null ? cipher.rand() : 0)) & 0xff, 'BYTE');

        let copyStart = 1;

        if(this.type === PacketType.DYNAMIC_SMALL) {
            buffer.put(packetSize, 'BYTE');
            copyStart = 2;
        } else if(this.type === PacketType.DYNAMIC_LARGE) {
            buffer.put(packetSize, 'SHORT');
            copyStart = 3;
        }

        this.copy(buffer, copyStart, 0, packetSize);
        return Buffer.from(buffer);
    }

    public get packetId(): number {
        return this._packetId;
    }

    public get type(): PacketType {
        return this._type;
    }
}
