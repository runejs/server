import { RsBuffer } from '@server/net/rs-buffer';
import { incomingPacketSizes } from '@server/net/incoming-packet-sizes';
import { handlePacket } from '@server/net/incoming-packet-directory';
import { DataParser } from './data-parser';

/**
 * Parses incoming packet data from the game client once the user is fully authenticated.
 */
export class ClientPacketDataParser extends DataParser {

    private activePacketId: number = null;
    private activePacketSize: number = null;
    private activeBuffer: RsBuffer;

    public parse(buffer?: RsBuffer): void {
        if(!this.activeBuffer) {
            this.activeBuffer = buffer;
        } else if(buffer) {
            const newBuffer = new RsBuffer(this.activeBuffer.getUnreadData());
            const activeLength = newBuffer.getBuffer().length;
            newBuffer.ensureCapacity(activeLength + buffer.getBuffer().length);
            buffer.getBuffer().copy(newBuffer.getBuffer(), activeLength, 0);
            this.activeBuffer = newBuffer;
        }

        if(this.activePacketId === null) {
            this.activePacketId = -1;
        }

        if(this.activePacketSize === null) {
            this.activePacketSize = -1;
        }

        const inCipher = this.clientConnection.player.inCipher;

        if(this.activePacketId === -1) {
            if(this.activeBuffer.getReadable() < 1) {
                return;
            }

            this.activePacketId = this.activeBuffer.readByte() & 0xff;
            this.activePacketId = (this.activePacketId - inCipher.rand()) & 0xff;
            this.activePacketSize = incomingPacketSizes[this.activePacketId];
        }

        // Packet will provide the size
        if(this.activePacketSize === -1) {
            if(this.activeBuffer.getReadable() < 1) {
                return;
            }

            this.activePacketSize = this.activeBuffer.readUnsignedByte();
        }

        // Packet has no set size
        let clearBuffer = false;
        if(this.activePacketSize === -3) {
            if(this.activeBuffer.getReadable() < 1) {
                return;
            }

            this.activePacketSize = this.activeBuffer.getReadable();
            clearBuffer = true;
        }

        if(this.activeBuffer.getReadable() < this.activePacketSize) {
            return;
        }

        // read packet data
        const packetData = this.activePacketSize !== 0 ? this.activeBuffer.readBytes(this.activePacketSize) : null;
        handlePacket(this.clientConnection.player, this.activePacketId, this.activePacketSize, packetData);

        if(clearBuffer) {
            this.activeBuffer = null;
        }

        this.activePacketId = null;
        this.activePacketSize = null;

        if(this.activeBuffer !== null && this.activeBuffer.getReadable() > 0) {
            this.parse();
        }
    }
}
