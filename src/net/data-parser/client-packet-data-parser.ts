import { RsBuffer } from '../rs-buffer';
import { incomingPacketSizes } from '../incoming-packet-sizes';
import { DataParser } from './data-parser';
import { handlePacket } from '../../world/entity/mob/player/packet/incoming-packet-directory';

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

        if(this.activePacketSize === -1) {
            if(this.activeBuffer.getReadable() < 1) {
                return;
            }

            this.activePacketSize = this.activeBuffer.readByte() & 0xff;
        }

        if(this.activeBuffer.getReadable() < this.activePacketSize) {
            console.error('Not enough readable data for packet ' + this.activePacketId + ' with size ' + this.activePacketSize + ', but only ' +
                this.activeBuffer.getReadable() + ' data is left of ' + this.activeBuffer.getBuffer().length);
            return;
        }

        if(this.activePacketSize !== 0) {
            // read packet data
            const packetData = this.activeBuffer.readBytes(this.activePacketSize);
            handlePacket(this.clientConnection.player, this.activePacketId, this.activePacketSize, packetData);
        }

        this.activePacketId = null;
        this.activePacketSize = null;

        if(this.activeBuffer.getReadable() > 0) {
            this.parse();
        }
    }
}
