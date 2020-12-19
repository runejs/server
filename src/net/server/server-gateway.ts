import { parseServerConfig, logger, ByteBuffer, SocketConnectionHandler } from '@runejs/core';
import { LoginResponseCode } from '@runejs/login-server';
import { Socket, createConnection } from 'net';
import { GameServerConnection } from '@server/net/server/game-server';
import { ServerConfig } from '@server/config/server-config';
import { Isaac } from '@server/net/isaac';
import { Player } from '@server/world/actor/player/player';
import { world } from '@server/game-server';

const serverConfig = parseServerConfig<ServerConfig>();

export type ServerType = 'game_server' | 'login_server' | 'update_server';

export class ServerGateway extends SocketConnectionHandler {

    private serverType: ServerType;
    private gameServerConnection: GameServerConnection;
    private loginServerSocket: Socket;
    private updateServerSocket: Socket;
    private serverKey: bigint;

    public constructor(private readonly clientSocket: Socket) {
        super();
    }

    public async dataReceived(buffer: ByteBuffer): Promise<void> {
        if(!this.serverType) {
            buffer = this.parseInitialClientHandshake(buffer);
        }

        switch(this.serverType) {
            case 'login_server':
                // Pass request data through to the login server
                this.loginServerSocket.write(buffer);
                break;
            case 'update_server':
                // Pass request data through to the update server
                this.updateServerSocket.write(buffer);
                break;
            default:
                if(this.gameServerConnection) {
                    // Use existing socket for game packets
                    await this.gameServerConnection.dataReceived(buffer);
                    break;
                }
        }

        return Promise.resolve();
    }

    public connectionDestroyed(): void {
        this.gameServerConnection?.connectionDestroyed();
    }

    private parseLoginServerResponse(buffer: ByteBuffer): void {
        if(!this.serverKey) {
            // Login handshake response
            const handshakeResponseCode = buffer.get();

            if(handshakeResponseCode === 0) {
                this.serverKey = BigInt(buffer.get('LONG'));
            }
        } else {
            // Login response
            const loginResponseCode = buffer.get();

            if(loginResponseCode === LoginResponseCode.SUCCESS) {
                try {
                    const clientKey1 = buffer.get('INT');
                    const clientKey2 = buffer.get('INT');
                    const gameClientId = buffer.get('INT');
                    const username = buffer.getString();
                    const passwordHash = buffer.getString();
                    const lowDetail = buffer.get() === 1;

                    if(world.playerOnline(username)) {
                        // Player is already logged in!
                        // @TODO move to login server
                        buffer = new ByteBuffer(1);
                        buffer.put(LoginResponseCode.ALREADY_LOGGED_IN);
                    } else {
                        this.createPlayer([ clientKey1, clientKey2 ], gameClientId, username, passwordHash, lowDetail ? 'low' : 'high');
                        this.serverType = 'game_server';
                        return;
                    }
                } catch(e) {
                    logger.error(e);
                    if(this.gameServerConnection) {
                        this.gameServerConnection.closeSocket();
                    }
                }
            }
        }

        // Write the login server response back to the game client
        this.clientSocket.write(buffer);
    }

    private createPlayer(clientKeys: [ number, number ], gameClientId: number, username: string, passwordHash: string, detail: 'high' | 'low'): void {
        const sessionKey: number[] = [
            Number(clientKeys[0]), Number(clientKeys[1]), Number(this.serverKey >> BigInt(32)), Number(this.serverKey)
        ];

        const inCipher = new Isaac(sessionKey);

        for(let i = 0; i < 4; i++) {
            sessionKey[i] += 50;
        }

        const outCipher = new Isaac(sessionKey);

        const player = new Player(this.clientSocket, inCipher, outCipher, gameClientId, username, passwordHash, detail === 'low');

        this.gameServerConnection = new GameServerConnection(this.clientSocket, player);

        world.registerPlayer(player);

        const outputBuffer = new ByteBuffer(6);
        outputBuffer.put(LoginResponseCode.SUCCESS, 'BYTE');
        outputBuffer.put(player.rights.valueOf(), 'BYTE');
        outputBuffer.put(0, 'BYTE'); // ???
        outputBuffer.put(player.worldIndex + 1, 'SHORT');
        outputBuffer.put(0, 'BYTE'); // ???
        this.clientSocket.write(outputBuffer);

        player.init();
    }

    private parseInitialClientHandshake(buffer: ByteBuffer): ByteBuffer {
        // First communication from the game client to the server gateway
        // Here we find out what kind of connection the client is making - game, or update server?
        // If game - they'll need to pass through the login server to authenticate first!

        const packetId = buffer.get('BYTE', 'UNSIGNED');

        if(packetId === 15) {
            this.serverType = 'update_server';
            this.updateServerSocket = createConnection({ host: serverConfig.updateServerHost, port: serverConfig.updateServerPort });
            this.updateServerSocket.on('data', data => this.clientSocket.write(data));
            this.updateServerSocket.on('end', () => {
                // @TODO
            });
            this.updateServerSocket.setNoDelay(true);
            this.updateServerSocket.setKeepAlive(true);
            this.updateServerSocket.setTimeout(30000);
        } else if(packetId === 14) {
            this.serverType = 'login_server';
            this.loginServerSocket = createConnection({ host: serverConfig.loginServerHost, port: serverConfig.loginServerPort });
            this.loginServerSocket.on('data', data => this.parseLoginServerResponse(new ByteBuffer(data)));
            this.loginServerSocket.on('end', () => {
                // @TODO
            });
            this.loginServerSocket.setNoDelay(true);
            this.loginServerSocket.setKeepAlive(true);
            this.loginServerSocket.setTimeout(30000);
        } else {
            throw new Error(`Invalid initial client handshake packet id.`);
        }

        return buffer.getSlice(1, buffer.length);
    }

}
