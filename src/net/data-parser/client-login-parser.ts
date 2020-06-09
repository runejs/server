import BigInteger from 'bigi';
import { Player } from '@server/world/actor/player/player';
import { Isaac } from '@server/net/isaac';
import { serverConfig, world } from '@server/game-server';
import { DataParser } from './data-parser';
import { logger } from '@runejs/logger';
import { ByteBuffer } from '@runejs/byte-buffer';
import * as bcrypt from 'bcrypt';
import { loadPlayerSave } from '@server/world/actor/player/player-data';

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
 * Codes for user login attempts that are sent back to the game client
 * to inform the user of the status of their login attempt.
 */
enum LoginResponseCode {
    SUCCESS = 2,
    INVALID_CREDENTIALS = 3,
    ACCOUNT_DISABLED = 4,
    ALREADY_LOGGED_IN = 5,
    GAME_UPDATED = 6,
    WORLD_FULL = 7,
    LOGIN_SERVER_OFFLINE = 8,
    LOGIN_LIMIT_EXCEEDED = 9,
    BAD_SESSION_ID = 10,
    // @TODO the rest
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

        const gameClientId = decrypted.get('INT');
        const usernameLong = BigInt(decrypted.get('LONG'));
        const username = longToName(usernameLong);
        const password = decrypted.getString();

        logger.info(`Login request: ${username}/${password}`);

        const credentialsResponseCode = this.checkCredentials(username, password);
        if(credentialsResponseCode === -1) {
            this.sendLogin([ clientKey1, clientKey2 ], gameClientId, username, password, isLowDetail);
        } else {
            logger.warn(`${username} attempted to login but received error code ${ credentialsResponseCode }.`);
            this.sendLoginResponse(credentialsResponseCode);
        }
    }

    /**
     * Logs a user in and notifies their game client of a successful login.
     * @param clientKeys The user's client keys (sent by the client).
     * @param gameClientId The user's game client ID (sent by the client).
     * @param username The user's username.
     * @param password The user's password.
     * @param isLowDetail Whether or not the user selected the "Low Detail" option.
     */
    private sendLogin(clientKeys: [ number, number ], gameClientId: number, username: string, password: string, isLowDetail: boolean): void {
        const sessionKey: number[] = [
            Number(clientKeys[0]), Number(clientKeys[1]), Number(this.clientConnection.serverKey >> BigInt(32)), Number(this.clientConnection.serverKey)
        ];

        const inCipher = new Isaac(sessionKey);

        for(let i = 0; i < 4; i++) {
            sessionKey[i] += 50;
        }

        const outCipher = new Isaac(sessionKey);
        const passwordHash = bcrypt.hashSync(password, bcrypt.genSaltSync());

        const player = new Player(this.clientConnection.socket, inCipher, outCipher, gameClientId, username, passwordHash, isLowDetail);

        world.registerPlayer(player);

        const outputBuffer = new ByteBuffer(6);
        outputBuffer.put(LoginResponseCode.SUCCESS, 'BYTE');
        outputBuffer.put(player.rights.valueOf(), 'BYTE');
        outputBuffer.put(0, 'BYTE'); // ???
        outputBuffer.put(player.worldIndex + 1, 'SHORT');
        outputBuffer.put(0, 'BYTE'); // ???
        this.clientConnection.socket.write(outputBuffer);

        player.init();

        this.clientConnection.clientKey1 = BigInt(clientKeys[0]);
        this.clientConnection.clientKey2 = BigInt(clientKeys[1]);
        this.clientConnection.player = player;
    }

    /**
     * Validates an incoming user's credentials and returns an error code if a problem occurs.
     * This also checks if the user is already online.
     * @param username The incoming user's username input.
     * @param password The incoming user's password input.
     */
    private checkCredentials(username: string, password: string): number {
        if(!serverConfig.checkCredentials) {
            return -1;
        }

        if(!username || !password) {
            return LoginResponseCode.INVALID_CREDENTIALS;
        }

        username = username.trim().toLowerCase();
        password = password.trim();

        if(username === '' || password === '') {
            return LoginResponseCode.INVALID_CREDENTIALS;
        }

        const playerSave = loadPlayerSave(username);
        if(playerSave) {
            const playerPasswordHash = playerSave.passwordHash;
            if(playerPasswordHash) {
                if(!bcrypt.compareSync(password, playerPasswordHash)) {
                    return LoginResponseCode.INVALID_CREDENTIALS;
                }
            } else if(serverConfig.checkCredentials) {
                logger.warn(`User ${ username } has no password hash saved - ` +
                    `their password will now be saved.`);
            }
        }

        if(world.playerOnline(username)) {
            return LoginResponseCode.ALREADY_LOGGED_IN;
        }

        return -1;
    }

    /**
     * Sends a login response code (by itself) to the game client.
     * Used for error responses.
     * @param responseCode The response code to send to the game client.
     */
    private sendLoginResponse(responseCode: number): void {
        const outputBuffer = new ByteBuffer(1);
        outputBuffer.put(responseCode, 'BYTE');
        this.clientConnection.socket.write(outputBuffer);
    }
}
