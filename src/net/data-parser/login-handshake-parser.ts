import { DataParser } from './data-parser';
import { ByteBuffer } from '@runejs/byte-buffer';

/**
 * Controls the initial login handshake with the server.
 */
export class LoginHandshakeParser extends DataParser {

    public parse(buffer: ByteBuffer, packetId: number): void {
        if(!buffer) {
            throw new Error('No data supplied for login handshake');
        }

        if(packetId === 14) {
            buffer.get('BYTE', 'UNSIGNED'); // Name hash

            const serverKey = BigInt(13371337); // TODO generate server_key

            const outputBuffer = new ByteBuffer(9);
            outputBuffer.put(0, 'BYTE'); // Initial server login response -> 0 for OK
            outputBuffer.put(serverKey, 'LONG');
            this.clientConnection.socket.write(outputBuffer);

            this.clientConnection.serverKey = serverKey;
        } else {
            throw new Error('Invalid login handshake packet id.');
        }
    }
}
