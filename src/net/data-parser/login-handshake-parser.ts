import { RsBuffer } from '@server/net/rs-buffer';
import { DataParser } from './data-parser';

/**
 * Controls the initial login handshake with the server.
 */
export class LoginHandshakeParser extends DataParser {

    public parse(buffer: RsBuffer, packetId: number): void {
        if(!buffer) {
            throw ('No data supplied for login handshake');
        }

        if(packetId === 14) {
            buffer.readUnsignedByte(); // Name hash

            const serverKey = BigInt(13371337); // TODO generate server_key

            const outputBuffer = RsBuffer.create();
            outputBuffer.writeByte(0); // Initial server login response -> 0 for OK
            outputBuffer.writeLongBE(serverKey);
            this.clientConnection.socket.write(outputBuffer.getData());

            this.clientConnection.serverKey = serverKey;
        } else {
            throw 'Invalid login handshake packet id.';
        }
    }
}
