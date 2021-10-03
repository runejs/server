import { createConnection, Socket } from 'net';

import { logger } from '@runejs/core';
import { ByteBuffer } from '@runejs/core/buffer';
import { parseServerConfig, SocketServer } from '@runejs/core/net';
import { LoginResponseCode } from '@runejs/login-server';

import { Isaac } from '@engine/net';
import { activeWorld } from '@engine/world';
import { Player } from '@engine/world/actor';
import { GameServerConfig, GameServerConnection } from '@server/game';


const serverConfig = parseServerConfig<GameServerConfig>();

export type ServerType = 'game_server' | 'login_server' | 'update_server';


export class GatewayServer extends SocketServer {

    private serverType: ServerType;
    private gameServerConnection: GameServerConnection;
    private loginServerSocket: Socket;
    private updateServerSocket: Socket;
    private serverKey: bigint;

    public constructor(private readonly clientSocket: Socket) {
        super(clientSocket);
    }

    public initialHandshake(buffer: ByteBuffer): boolean {
        if(this.serverType) {
            this.decodeMessage(buffer);
            return true;
        }

        // First communication from the game client to the server gateway
        // Here we find out what kind of connection the client is making - game, or update server?
        // If game - they'll need to pass through the login server to authenticate first!

        const packetId = buffer.get('byte', 'u');

        if(packetId === 15) {
            this.serverType = 'update_server';
            this.updateServerSocket = createConnection({
                host: serverConfig.updateServerHost,
                port: serverConfig.updateServerPort
            });
            this.updateServerSocket.on('data', data => this.clientSocket.write(data));
            this.updateServerSocket.on('end', () => {
                logger.info(`Update server connection closed.`);
            });
            this.updateServerSocket.on('error', () => {
                logger.error(`Update server error.`);
            })
            this.updateServerSocket.setNoDelay(true);
            this.updateServerSocket.setKeepAlive(true);
            this.updateServerSocket.setTimeout(30000);
        } else if(packetId === 14) {
            this.serverType = 'login_server';
            this.loginServerSocket = createConnection({
                host: serverConfig.loginServerHost,
                port: serverConfig.loginServerPort
            });
            this.loginServerSocket.on('data', data => {
                this.parseLoginServerResponse(new ByteBuffer(data));
            });
            this.loginServerSocket.on('end', () => {
                logger.error(`Login server error.`);
            });
            this.loginServerSocket.setNoDelay(true);
            this.loginServerSocket.setKeepAlive(true);
            this.loginServerSocket.setTimeout(30000);
        } else {
            logger.error(`Invalid initial client handshake packet id.`);
            return false;
        }

        const data = buffer.getSlice(1, buffer.length);
        const socket = this.serverType === 'login_server' ? this.loginServerSocket : this.updateServerSocket;
        socket.write(data);

        return true;
    }

    public decodeMessage(buffer: ByteBuffer): void | Promise<void> {
        if(this.serverType === 'login_server') {
            this.loginServerSocket.write(buffer);
        } else if(this.serverType === 'update_server') {
            this.updateServerSocket.write(buffer);
        } else {
            this.gameServerConnection?.decodeMessage(buffer);
        }
    }

    public connectionDestroyed(): void {
        this.loginServerSocket?.destroy();
        this.updateServerSocket?.destroy();
        this.gameServerConnection?.connectionDestroyed();
    }

    private async parseLoginServerResponse(buffer: ByteBuffer): Promise<void> {
        if(!this.serverKey) {
            // Login handshake response
            const handshakeResponseCode = buffer.get('byte');

            if(handshakeResponseCode === 0) {
                this.serverKey = BigInt(buffer.get('long'));
            }
        } else {
            // Login response
            const loginResponseCode = buffer.get('byte');

            if(loginResponseCode === LoginResponseCode.SUCCESS) {
                try {
                    const clientKey1 = buffer.get('int');
                    const clientKey2 = buffer.get('int');
                    const gameClientId = buffer.get('int');
                    const username = buffer.getString();
                    const passwordHash = buffer.getString();
                    const lowDetail = buffer.get('byte') === 1;

                    if(activeWorld.playerOnline(username)) {
                        // Player is already logged in!
                        // @TODO move to login server
                        buffer = new ByteBuffer(1);
                        buffer.put(LoginResponseCode.ALREADY_LOGGED_IN);
                    } else {
                        this.serverType = 'game_server';
                        await this.createPlayer([ clientKey1, clientKey2 ],
                            gameClientId, username, passwordHash, lowDetail ? 'low' : 'high');
                        return;
                    }
                } catch(e) {
                    this.gameServerConnection?.closeSocket();
                    logger.error(e);
                }
            }
        }

        // Write the login server response back to the game client
        this.clientSocket.write(buffer);
    }

    private async createPlayer(clientKeys: [ number, number ],
                               gameClientId: number,
                               username: string,
                               passwordHash: string,
                               detail: 'high' | 'low'): Promise<void> {
        const sessionKey: number[] = [
            Number(clientKeys[0]),
            Number(clientKeys[1]),
            Number(this.serverKey >> BigInt(32)),
            Number(this.serverKey)
        ];

        const inCipher = new Isaac(sessionKey);

        for(let i = 0; i < 4; i++) {
            sessionKey[i] += 50;
        }

        const outCipher = new Isaac(sessionKey);

        const player = new Player(this.clientSocket, inCipher, outCipher, gameClientId,
            username, passwordHash, detail === 'low');

        this.gameServerConnection = new GameServerConnection(this.clientSocket, player);

        activeWorld.registerPlayer(player);

        const outputBuffer = new ByteBuffer(6);

        outputBuffer.put(LoginResponseCode.SUCCESS, 'byte');
        outputBuffer.put(player.rights.valueOf(), 'byte');
        outputBuffer.put(0, 'byte'); // ???
        outputBuffer.put(player.worldIndex + 1, 'short');
        outputBuffer.put(0, 'byte'); // ???
        this.clientSocket.write(outputBuffer);

        await player.init();
    }

}
