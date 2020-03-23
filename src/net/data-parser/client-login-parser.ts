import BigInteger from 'bigi';
import { Player } from '@server/world/actor/player/player';
import { Isaac } from '@server/net/isaac';
import { serverConfig, world } from '@server/game-server';
import { DataParser } from './data-parser';
import { logger } from '@runejs/logger/dist/logger';
import { ByteBuffer } from '@runejs/byte-buffer';

const VALID_CHARS = ['_', 'a', 'b', 'c', 'd',
    'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q',
    'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3',
    '4', '5', '6', '7', '8', '9', '!', '@', '#', '$', '%', '^', '&',
    '*', '(', ')', '-', '+', '=', ':', ';', '.', '>', '<', ',', '"',
    '[', ']', '|', '?', '/', '`'];

function longToName(nameLong: BigInt): string {
    let ac: string = '';
    while(nameLong !== BigInt(0)) {
        const l1 = nameLong;
        nameLong = BigInt(nameLong) / BigInt(37);
        ac += VALID_CHARS[parseInt(l1.toString()) - parseInt(nameLong.toString()) * 37];
    }

    return ac.split('').reverse().join('');
}

/**
 * Parses the login packet from the game client.
 */
export class ClientLoginParser extends DataParser {

    private readonly rsaModulus = BigInteger(serverConfig.rsaMod);
    private readonly rsaExponent = BigInteger(serverConfig.rsaExp);

    public parse(buffer?: ByteBuffer): void {
        if(!buffer) {
            throw new Error('No data supplied for login');
        }

        const loginType = buffer.get('BYTE', 'UNSIGNED');

        if(loginType !== 16 && loginType !== 18) {
            throw new Error('Invalid login type ' + loginType);
        }

        let loginEncryptedSize = buffer.get('BYTE', 'UNSIGNED') - (36 + 1 + 1 + 2);

        if(loginEncryptedSize <= 0) {
            throw new Error('Invalid login packet length ' + loginEncryptedSize);
        }

        const gameVersion = buffer.get('INT');

        if(gameVersion !== 435) {
            throw new Error('Invalid game version ' + gameVersion);
        }

        const isLowDetail: boolean = buffer.get('BYTE') === 1;

        for(let i = 0; i < 13; i++) {
            buffer.get('INT'); // Cache indices
        }

        loginEncryptedSize--;

        const rsaBytes = buffer.get('BYTE', 'UNSIGNED');

        const encryptedBytes: Buffer = Buffer.alloc(rsaBytes);
        buffer.copy(encryptedBytes, 0, buffer.readerIndex);
        const decrypted = new ByteBuffer(BigInteger.fromBuffer(encryptedBytes).modPow(this.rsaExponent, this.rsaModulus).toBuffer());

        const blockId = decrypted.get('BYTE');

        if(blockId !== 10) {
            throw new Error('Invalid block id ' + blockId);
        }

        const clientKey1 = decrypted.get('INT');
        const clientKey2 = decrypted.get('INT');
        const incomingServerKey = BigInt(decrypted.get('LONG'));

        if(this.clientConnection.serverKey !== incomingServerKey) {
            throw new Error(`Server key mismatch - ${this.clientConnection.serverKey} != ${incomingServerKey}`);
        }

        const clientUuid = decrypted.get('INT');
        const usernameLong = BigInt(decrypted.get('LONG'));
        const username = longToName(usernameLong);
        const password = decrypted.getString();

        logger.info(`Login request: ${username}/${password}`);

        const sessionKey: number[] = [
            Number(clientKey1), Number(clientKey2), Number(this.clientConnection.serverKey >> BigInt(32)), Number(this.clientConnection.serverKey)
        ];

        const inCipher = new Isaac(sessionKey);

        for(let i = 0; i < 4; i++) {
            sessionKey[i] += 50;
        }

        const outCipher = new Isaac(sessionKey);

        const player = new Player(this.clientConnection.socket, inCipher, outCipher, clientUuid, username, password, isLowDetail);

        world.registerPlayer(player);

        const outputBuffer = new ByteBuffer(6);
        outputBuffer.put(2, 'BYTE'); // login response code
        outputBuffer.put(player.rights.valueOf(), 'BYTE');
        outputBuffer.put(0, 'BYTE'); // ???
        outputBuffer.put(player.worldIndex + 1, 'SHORT');
        outputBuffer.put(0, 'BYTE'); // ???
        this.clientConnection.socket.write(outputBuffer);

        player.init();

        this.clientConnection.clientKey1 = BigInt(clientKey1);
        this.clientConnection.clientKey2 = BigInt(clientKey2);
        this.clientConnection.player = player;
    }
}
