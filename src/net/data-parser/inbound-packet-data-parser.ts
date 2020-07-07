import { handlePacket, incomingPackets } from '../inbound-packets';
import { DataParser } from './data-parser';
import { ByteBuffer } from '@runejs/byte-buffer';
import { logger } from '@runejs/logger';

/**
 * Parses inbound packet data from the game client once the user is fully authenticated.
 */
export class InboundPacketDataParser extends DataParser {

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
            const incomingPacket = incomingPackets.get(this.activePacketId);
            if(incomingPacket) {
                this.activePacketSize = incomingPacket.size;
            } else {
                this.activePacketSize = -3;
            }
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

        try {
            handlePacket(this.clientConnection.player, this.activePacketId, this.activePacketSize, packetData);
        } catch(e) {
            logger.warn(`${ this.clientConnection.player.username } was kicked for sending invalid packet ` +
                `${ this.activePacketId }.`);
            clearBuffer = true;
            this.activeBuffer = null;
            this.clientConnection.socket.destroy();
        }

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
