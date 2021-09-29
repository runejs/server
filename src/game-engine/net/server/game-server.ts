import { logger } from '@runejs/core';
import { ConnectionStatus, SocketServer } from '@runejs/core/net';
import { ByteBuffer } from '@runejs/core/buffer';
import { Socket } from 'net';
import { ServerGateway } from '@engine/net/server/server-gateway';
import { handlePacket, incomingPackets } from '@engine/net/inbound-packets';
import { Player } from '@engine/world/actor/player/player';


export class GameServerConnection {

    private activePacketId: number = null;
    private activePacketSize: number = null;
    private activeBuffer: ByteBuffer;

    public constructor(private readonly clientSocket: Socket,
                       private readonly player: Player) {
    }

    public decodeMessage(buffer?: ByteBuffer): void | Promise<void> {
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

        if(!handlePacket(this.player, this.activePacketId, this.activePacketSize, packetData)) {
            logger.error(`Player packets out of sync for ${this.player.username}, resetting packet buffer...`);
            logger.error(`If you're seeing this, there's a packet that needs fixing. :)`);
            clearBuffer = true;
        }

        if(clearBuffer) {
            this.activeBuffer = null;
        }

        this.activePacketId = null;
        this.activePacketSize = null;

        if(this.activeBuffer !== null && this.activeBuffer.readable > 0) {
            this.decodeMessage();
        }
    }

    public connectionDestroyed(): void {
        logger.info(`Connection destroyed.`);
        this.player?.logout();
    }

    public closeSocket(): void {
        this.clientSocket.destroy();
    }

}

export const openGameServer = (host: string, port: number): void =>
    SocketServer.launch<ServerGateway>(
        'Game Server',
        host, port, socket => new ServerGateway(socket));
