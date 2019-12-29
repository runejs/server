import { RsBuffer } from '../rs-buffer';
import { DataParser } from './data-parser';

/**
 * Controls the initial client handshake with the server.
 */
export class ClientHandshakeParser extends DataParser {

    public parse(buffer?: RsBuffer): void {
        if(!buffer) {
            throw ('No data supplied for client handshake');
        }

        const handshakePacketId = buffer.readUnsignedByte();

        if(handshakePacketId === 14) {
            buffer.readUnsignedByte(); // Name hash

            const outputBuffer = RsBuffer.create();
            for(let i = 0; i < 8; i++) {
                outputBuffer.writeByte(0);
            }

            const serverKey = BigInt(1337); // TODO generate server_key

            outputBuffer.writeByte(0); // Initial server login response -> 0 for OK
            outputBuffer.writeLongBE(serverKey);
            this.clientConnection.socket.write(outputBuffer.getData());

            this.clientConnection.serverKey = serverKey;
        } else {
            throw 'Invalid handshake packet id.';
        }
    }
}
