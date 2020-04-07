import { DataParser } from './data-parser';
import { ByteBuffer } from '@runejs/byte-buffer';

/**
 * Controls the version handshake with the server.
 */
export class VersionHandshakeParser extends DataParser {

    public parse(buffer: ByteBuffer, packetId: number): void {
        if(!buffer) {
            throw new Error('No data supplied for version handshake');
        }

        if(packetId === 15) {
            const gameVersion = buffer.get('INT');

            const outputBuffer = new ByteBuffer(1);
            outputBuffer.put(gameVersion === 435 ? 0 : 6, 'BYTE');
            this.clientConnection.socket.write(outputBuffer);
        } else {
            throw new Error('Invalid version handshake packet id.');
        }
    }
}
