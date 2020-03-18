import { RsBuffer } from '@server/net/rs-buffer';
import { DataParser } from './data-parser';

/**
 * Controls the version handshake with the server.
 */
export class VersionHandshakeParser extends DataParser {

    public parse(buffer: RsBuffer, packetId: number): void {
        if(!buffer) {
            throw new Error('No data supplied for version handshake');
        }

        if(packetId === 15) {
            const gameVersion = buffer.readIntBE();

            const outputBuffer = RsBuffer.create();
            outputBuffer.writeByte(gameVersion === 435 ? 0 : 6);
            this.clientConnection.socket.write(outputBuffer.getData());
        } else {
            throw new Error('Invalid version handshake packet id.');
        }
    }
}
