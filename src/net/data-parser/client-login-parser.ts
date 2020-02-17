import BigInteger from 'bigi';
import { RsBuffer } from '@server/net/rs-buffer';
import { Player } from '@server/world/mob/player/player';
import { Isaac } from '@server/net/isaac';
import { serverConfig, world } from '@server/game-server';
import { DataParser } from './data-parser';

/**
 * Parses the login packet from the game client.
 */
export class ClientLoginParser extends DataParser {

    private readonly rsaModulus = BigInteger(serverConfig.rsaMod);
    private readonly rsaExponent = BigInteger(serverConfig.rsaExp);

    public parse(buffer?: RsBuffer): void {
        if(!buffer) {
            throw ('No data supplied for login');
        }

        const loginType = buffer.readUnsignedByte();

        if(loginType !== 16 && loginType !== 18) {
            throw ('Invalid login type ' + loginType);
        }

        let loginEncryptedSize = buffer.readUnsignedByte() - (36 + 1 + 1 + 2);

        if(loginEncryptedSize <= 0) {
            throw ('Invalid login packet length ' + loginEncryptedSize);
        }

        const packetId = buffer.readUnsignedByte();

        if(packetId !== 255) {
            throw ('Invalid login packet id ' + packetId);
        }

        const gameVersion = buffer.readUnsignedShortBE();

        if(gameVersion !== 377) {
            throw ('Invalid game version ' + gameVersion);
        }

        const isLowDetail: boolean = buffer.readByte() === 1;

        for(let i = 0; i < 9; i++) {
            buffer.readIntBE(); // Cache indices
        }

        loginEncryptedSize--;

        const reportedSize = buffer.readUnsignedByte();

        if(loginEncryptedSize !== reportedSize) {
            throw (`Packet size mismatch - ${loginEncryptedSize} vs ${reportedSize}`);
        }

        const encryptedBytes: Buffer = Buffer.alloc(loginEncryptedSize);
        buffer.getBuffer().copy(encryptedBytes, 0, buffer.getReaderIndex());
        const decrypted: RsBuffer = new RsBuffer(BigInteger.fromBuffer(encryptedBytes).modPow(this.rsaExponent, this.rsaModulus).toBuffer());

        const blockId = decrypted.readByte();

        if(blockId !== 10) {
            throw ('Invalid block id ' + blockId);
        }

        const clientKey1 = decrypted.readIntBE();
        const clientKey2 = decrypted.readIntBE();
        const incomingServerKey = decrypted.readLongBE();

        if(this.clientConnection.serverKey !== incomingServerKey) {
            throw (`Server key mismatch - ${this.clientConnection.serverKey} != ${incomingServerKey}`);
        }

        const clientUuid = decrypted.readIntBE();
        const username = decrypted.readString();
        const password = decrypted.readString();

        const sessionKey: number[] = [
            Number(clientKey1), Number(clientKey2), Number(this.clientConnection.serverKey >> BigInt(32)), Number(this.clientConnection.serverKey)
        ];

        const inCipher = new Isaac(sessionKey);

        for(let i = 0; i < 4; i++) {
            sessionKey[i] += 50;
        }

        const outCipher = new Isaac(sessionKey);

        const player = new Player(this.clientConnection.socket, inCipher, outCipher, clientUuid, username, password, isLowDetail);

        const outputBuffer = RsBuffer.create();
        outputBuffer.writeByte(2); // login response code
        outputBuffer.writeByte(player.rights.valueOf());
        outputBuffer.writeByte(0); // ???
        this.clientConnection.socket.write(outputBuffer.getData());

        world.registerPlayer(player);

        this.clientConnection.clientKey1 = BigInt(clientKey1);
        this.clientConnection.clientKey2 = BigInt(clientKey2);
        this.clientConnection.player = player;
    }
}
