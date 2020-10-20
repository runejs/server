import { Socket } from 'net';
import { ByteBuffer } from '@runejs/byte-buffer';
import { parseServerConfig } from '@server/world/config/server-config';
import { logger } from '@runejs/logger';
import { loadPlayerSave } from '@server/world/actor/player/player-data';
import BigInteger from 'bigi';
import * as bcrypt from 'bcrypt';
import { longToString } from '@server/util/strings';
import { openServer, SocketConnectionHandler } from '@server/net/socket-server';

const serverConfig = parseServerConfig();

const VALID_CHARS = ['_', 'a', 'b', 'c', 'd',
    'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q',
    'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3',
    '4', '5', '6', '7', '8', '9', '!', '@', '#', '$', '%', '^', '&',
    '*', '(', ')', '-', '+', '=', ':', ';', '.', '>', '<', ',', '"',
    '[', ']', '|', '?', '/', '`'];

enum ConnectionStage {
    HANDSHAKE = 'handshake',
    ACTIVE = 'active'
}

/**
 * Codes for user login attempts that are sent back to the game client
 * to inform the user of the status of their login attempt.
 */
export enum LoginResponseCode {
    SUCCESS = 2,
    INVALID_CREDENTIALS = 3,
    ACCOUNT_DISABLED = 4,
    ALREADY_LOGGED_IN = 5,
    GAME_UPDATED = 6,
    WORLD_FULL = 7,
    LOGIN_SERVER_OFFLINE = 8,
    LOGIN_LIMIT_EXCEEDED = 9,
    BAD_SESSION_ID = 10
    // @TODO the rest
}

class LoginServerConnection extends SocketConnectionHandler {

    private readonly rsaModulus = BigInteger(serverConfig.rsaMod);
    private readonly rsaExponent = BigInteger(serverConfig.rsaExp);
    private connectionStage: ConnectionStage = ConnectionStage.HANDSHAKE;
    private serverKey: bigint;

    public constructor(private readonly gameServerSocket: Socket) {
        super();
    }

    public async dataReceived(buffer: ByteBuffer): Promise<void> {
        if(!buffer) {
            logger.info('No data supplied in message to login server.');
            return;
        }

        switch(this.connectionStage) {
            case ConnectionStage.HANDSHAKE:
                this.handleLoginHandshake(buffer);
                break;
            default:
                this.authenticate(buffer);
                break;
        }

        return Promise.resolve();
    }

    public connectionDestroyed(): void {
    }

    private authenticate(buffer: ByteBuffer): void {
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
            // @TODO validate these against the cache !!!
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

        if(this.serverKey !== incomingServerKey) {
            throw new Error(`Server key mismatch - ${this.serverKey} !== ${incomingServerKey}`);
        }

        const gameClientId = decrypted.get('INT');
        const usernameLong = BigInt(decrypted.get('LONG'));
        const username = longToString(usernameLong);
        const password = decrypted.getString();

        logger.info(`Login request: ${username}/${password}`);

        const credentialsResponseCode = this.checkCredentials(username, password);
        if(credentialsResponseCode === -1) {
            this.sendLogin([ clientKey1, clientKey2 ], gameClientId, username, password, isLowDetail);
        } else {
            logger.info(`${username} attempted to login but received error code ${ credentialsResponseCode }.`);
            this.sendLoginResponse(credentialsResponseCode);
        }
    }

    /**
     * Logs a user in and notifies their game server of a successful login.
     * @param clientKeys The user's client keys (sent by the client).
     * @param gameClientId The user's game client ID (sent by the client).
     * @param username The user's username.
     * @param password The user's password.
     * @param isLowDetail Whether or not the user selected the "Low Detail" option.
     */
    private sendLogin(clientKeys: [ number, number ], gameClientId: number, username: string, password: string, isLowDetail: boolean): void {
        const outputBuffer = new ByteBuffer(400);
        outputBuffer.put(LoginResponseCode.SUCCESS);
        outputBuffer.put(clientKeys[0], 'INT');
        outputBuffer.put(clientKeys[1], 'INT');
        outputBuffer.put(gameClientId, 'INT');
        outputBuffer.putString(username);
        outputBuffer.putString(bcrypt.hashSync(password, bcrypt.genSaltSync()));
        outputBuffer.put(isLowDetail ? 1 : 0);
        this.gameServerSocket.write(outputBuffer.getSlice(0, outputBuffer.writerIndex));
    }

    /**
     * Sends a simple login response code to the game server.
     * @param responseCode The specific response code to send.
     */
    private sendLoginResponse(responseCode: number): void {
        const outputBuffer = new ByteBuffer(1);
        outputBuffer.put(responseCode, 'BYTE');
        this.gameServerSocket.write(outputBuffer);
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

        return -1;
    }

    private handleLoginHandshake(buffer: ByteBuffer): void {
        buffer.get('BYTE', 'UNSIGNED'); // Name hash

        this.serverKey = BigInt(Math.floor(Math.random() * 999999));

        const outputBuffer = new ByteBuffer(9);
        outputBuffer.put(0, 'BYTE'); // Initial server login response -> 0 for OK
        outputBuffer.put(this.serverKey, 'LONG');
        this.gameServerSocket.write(outputBuffer);

        this.connectionStage = ConnectionStage.ACTIVE;
    }

}

export const openLoginServer = (host: string, port: number): void =>
    openServer<LoginServerConnection>('Loginserver', host, port, socket => new LoginServerConnection(socket));
