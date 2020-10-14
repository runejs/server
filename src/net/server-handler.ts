import { Socket, createServer } from 'net';
import { logger } from '@runejs/logger/dist/logger';
import { ByteBuffer } from '@runejs/byte-buffer';
import { createLoginServerConnection } from '@server/net/server/loginserver';
import { createGameServerConnection, GameServerConnection } from '@server/net/server/gameserver';
import { parseServerConfig } from '@server/world/config/server-config';

const serverConfig = parseServerConfig();

export type ServerType = 'game_server' | 'login_server' | 'update_server';

export abstract class SocketConnectionHandler {
    public abstract async dataReceived(buffer: ByteBuffer): Promise<void>;
}

class ServerGateway {

    private serverType: ServerType;
    private gameServerConnection: GameServerConnection;
    private loginServerSocket: Socket;
    private updateServerSocket: Socket;

    public constructor(private readonly clientSocket: Socket) {
    }

    public async dataReceived(buffer: ByteBuffer): Promise<void> {
        if(!this.serverType) {
            this.parseInitialClientHandshake(buffer);
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

    private parseLoginServerResponse(buffer: ByteBuffer): void {
        // Write the login server response back to the game client
        this.clientSocket.write(buffer);

    }

    private parseInitialClientHandshake(buffer: ByteBuffer): void {
        // First communication from the game client to the server gateway
        // Here we find out what kind of connection the client is making - game, or update server?
        // If game - they'll need to pass through the login server to authenticate first!

        const packetId = buffer.get('BYTE', 'UNSIGNED');

        if(packetId === 15) {
            this.serverType = 'update_server';
            this.updateServerSocket = new Socket()
                .on('data', data => this.clientSocket.write(data))
                .connect({ host: serverConfig.updateServerHost, port: serverConfig.updateServerPort });
        } else if(packetId === 14) {
            this.serverType = 'login_server';
            this.loginServerSocket = new Socket()
                .on('data', data => this.parseLoginServerResponse(new ByteBuffer(data)))
                .connect({ host: serverConfig.updateServerHost, port: serverConfig.updateServerPort });
        } else {
            throw new Error(`Invalid initial client handshake packet id.`);
        }
    }

}

const socketError = (socket: Socket): void => {
    logger.error('Socket destroyed due to connection error.');
    logger.error(error.message);
    socket.destroy();
};

export const registerSocket = (socket: Socket, type: ServerType): void => {
    socket.setNoDelay(true);
    socket.setKeepAlive(true);
    socket.setTimeout(30000);

    const connectionHandler: SocketConnectionHandler = type === 'game_server' ?
        createGameServerConnection(socket) : createLoginServerConnection(socket);

    socket.on('data', data =>
        connectionHandler.dataReceived(new ByteBuffer(data)));

    socket.on('close', () => {
        // @TODO socket close event
    });

    socket.on('error', socketError);
};

export const openServer = (host: string, port: number, type: ServerType): void => {
    createServer(socket => registerSocket(socket, type)).listen(port, host);
    logger.info(`${type} listening @ ${ host }:${ port }.`);
};
