import { incomingPacketSizes } from '@server/net/incoming-packet-sizes';
import { handlePacket } from '@server/net/incoming-packet-directory';
import { DataParser } from './data-parser';
import { ByteBuffer } from '@runejs/byte-buffer';

/**
 * Parses incoming packet data from the game client once the user is fully authenticated.
 */
export class ClientPacketDataParser extends DataParser {

    private activePacketId: number = null;
    private activePacketSize: number = null;
    private activeBuffer: ByteBuffer;

    public parse(buffer?: ByteBuffer): void {
        if(!this.activeBuffer) {
            this.activeBuffer = buffer;
        } else if(buffer) {
            const readable = this.activeBuffer.readable;
            const newBuffer = new ByteBuffer(readable + buffer.length);
            this.activeBuffer.copy(newBuffer, 0, this.activeBuffer.readerIndex);
            buffer.copy(newBuffer, readable, 0);
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
            if(this.activeBuffer.readable < 1) {
                return;
            }

            this.activePacketId = this.activeBuffer.get('BYTE', 'UNSIGNED');
            this.activePacketId = (this.activePacketId - inCipher.rand()) & 0xff;
            this.activePacketSize = incomingPacketSizes[this.activePacketId];
        }

        // Packet will provide the size
        if(this.activePacketSize === -1) {
            if(this.activeBuffer.readable < 1) {
                return;
            }

            this.activePacketSize = this.activeBuffer.get('BYTE', 'UNSIGNED');
        }

        // Packet has no set size
        let clearBuffer = false;
        if(this.activePacketSize === -3) {
            if(this.activeBuffer.readable < 1) {
                return;
            }

            this.activePacketSize = this.activeBuffer.readable;
            clearBuffer = true;
        }

        if(this.activeBuffer.readable < this.activePacketSize) {
            return;
        }

        // read packet data
        let packetData = null;
        if(this.activePacketSize !== 0) {
            packetData = new ByteBuffer(this.activePacketSize);
            this.activeBuffer.copy(packetData, 0, this.activeBuffer.readerIndex, this.activeBuffer.readerIndex + this.activePacketSize);
            this.activeBuffer.readerIndex += this.activePacketSize;
        }
        handlePacket(this.clientConnection.player, this.activePacketId, this.activePacketSize, packetData);

        if(clearBuffer) {
            this.activeBuffer = null;
        }

        this.activePacketId = null;
        this.activePacketSize = null;

        if(this.activeBuffer !== null && this.activeBuffer.readable > 0) {
            this.parse();
        }
    }
}
