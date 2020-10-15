import { createServer, Socket } from 'net';
import { ServerGateway, SocketConnectionHandler } from '@server/net/server/server-gateway';
import { ByteBuffer } from '@runejs/byte-buffer';
import { handlePacket, incomingPackets } from '@server/net/inbound-packets';
import { Player } from '@server/world/actor/player/player';
import { logger } from '@runejs/logger';

export class GameServerConnection implements SocketConnectionHandler {

    private activePacketId: number = null;
    private activePacketSize: number = null;
    private activeBuffer: ByteBuffer;

    public constructor(private readonly clientSocket: Socket, private readonly player: Player) {
    }

    public async dataReceived(buffer?: ByteBuffer): Promise<void> {
        if(!this.activeBuffer) {
            this.activeBuffer = buffer;
        } else if(buffer) {
            const readable = this.activeBuffer.readable;
            const newBuffer = new ByteBuffer(readable + buffer.length);
            this.activeBuffer.copy(newBuffer, 0, this.activeBuffer.readerIndex);
            buffer.copy(newBuffer, readable, 0);
            this.activeBuffer = newBuffer;
        }

        if(this.activePacketId === null) {
            this.activePacketId = -1;
        }

        if(this.activePacketSize === null) {
            this.activePacketSize = -1;
        }

        const inCipher = this.player.inCipher;

        if(this.activePacketId === -1) {
            if(this.activeBuffer.readable < 1) {
                return;
            }

            this.activePacketId = this.activeBuffer.get('BYTE', 'UNSIGNED');
            this.activePacketId = (this.activePacketId - inCipher.rand()) & 0xff;
            const incomingPacket = incomingPackets.get(this.activePacketId);
            if(incomingPacket) {
                this.activePacketSize = incomingPacket.size;
            } else {
                this.activePacketSize = -3;
            }
        }

        // Packet will provide the size
        if(this.activePacketSize === -1) {
            if(this.activeBuffer.readable < 1) {
                return;
            }

            this.activePacketSize = this.activeBuffer.get('BYTE', 'UNSIGNED');
        }

        // Packet has no set size
        let clearBuffer = false;
        if(this.activePacketSize === -3) {
            if(this.activeBuffer.readable < 1) {
                return;
            }

            this.activePacketSize = this.activeBuffer.readable;
            clearBuffer = true;
        }

        if(this.activeBuffer.readable < this.activePacketSize) {
            return;
        }

        // read packet data
        let packetData = null;
        if(this.activePacketSize !== 0) {
            packetData = new ByteBuffer(this.activePacketSize);
            this.activeBuffer.copy(packetData, 0, this.activeBuffer.readerIndex, this.activeBuffer.readerIndex + this.activePacketSize);
            this.activeBuffer.readerIndex += this.activePacketSize;
        }
        handlePacket(this.player, this.activePacketId, this.activePacketSize, packetData);

        if(clearBuffer) {
            this.activeBuffer = null;
        }

        this.activePacketId = null;
        this.activePacketSize = null;

        if(this.activeBuffer !== null && this.activeBuffer.readable > 0) {
            await this.dataReceived();
        }

        return Promise.resolve();
    }

    public closeSocket(): void {
        this.clientSocket.destroy();
    }

}

const socketError = (socket: Socket, error): void => {
    logger.error('Socket destroyed due to connection error.');
    logger.error(error?.message || '[no message]');
    socket.destroy();
};

const registerSocket = (socket: Socket): void => {
    socket.setNoDelay(true);
    socket.setKeepAlive(true);
    socket.setTimeout(30000);

    const gateway: ServerGateway = new ServerGateway(socket);

    socket.on('data', async data => {
        try {
            await gateway.dataReceived(new ByteBuffer(data));
        } catch(e) {
            logger.error(e);
            socket.destroy();
        }
    });

    socket.on('close', () => {
        // @TODO socket close event
    });

    socket.on('error', error => socketError(socket, error));
};

export const openGameServer = (host: string, port: number): void => {
    createServer(socket => registerSocket(socket)).listen(port, host);
    logger.info(`Gameserver listening @ ${ host }:${ port }.`);
};
