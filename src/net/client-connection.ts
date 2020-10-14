import { Socket } from 'net';
import { Player } from '@server/world/actor/player/player';
import { world } from '@server/game-server';
import { LoginHandshakeParser } from './data-parser/login-handshake-parser';
import { ClientLoginParser } from './data-parser/client-login-parser';
import { InboundPacketDataParser } from './data-parser/inbound-packet-data-parser';
import { DataParser } from './data-parser/data-parser';
import { VersionHandshakeParser } from '@server/net/data-parser/version-handshake-parser';
import { UpdateServerParser } from '@server/net/data-parser/update-server-parser';
import { ByteBuffer } from '@runejs/byte-buffer';

enum ConnectionStage {
    VERSION_HANDSHAKE = 'VERSION_HANDSHAKE',
    UPDATE_SERVER = 'UPDATE_SERVER',
    LOGIN_HANDSHAKE = 'LOGIN_HANDSHAKE',
    LOGIN = 'LOGIN',
    LOGGED_IN = 'LOGGED_IN'
}

/**
 * Handles a single client connection to the game server.
 */
export class ClientConnection {

    private _connectionStage: ConnectionStage = null;
    private dataParser: DataParser;
    private _serverKey: bigint;
    private _clientKey1: bigint;
    private _clientKey2: bigint;
    private _player: Player;

    public constructor(public readonly socket: Socket) {
        this.socket = socket;
        this.dataParser = null;
        socket.emit('name', {});
    }

    public parseIncomingData(buffer?: ByteBuffer): void {
        try {
            if(!this.connectionStage) {
                const packetId = buffer.get('BYTE', 'UNSIGNED');

                if(packetId === 15) {
                    this.connectionStage = ConnectionStage.VERSION_HANDSHAKE;
                    this.dataParser = new VersionHandshakeParser(this);
                } else if(packetId === 14) {
                    this.connectionStage = ConnectionStage.LOGIN_HANDSHAKE;
                    this.dataParser = new LoginHandshakeParser(this);
                }

                this.dataParser.parse(buffer, packetId);
            } else {
                this.dataParser.parse(buffer);
            }

            if(this.connectionStage === ConnectionStage.VERSION_HANDSHAKE) {
                this.connectionStage = ConnectionStage.UPDATE_SERVER;
                this.dataParser = new UpdateServerParser(this);
            } else if(this.connectionStage === ConnectionStage.LOGIN_HANDSHAKE) {
                this.connectionStage = ConnectionStage.LOGIN;
                this.dataParser = new ClientLoginParser(this);
            } else if(this.connectionStage === ConnectionStage.LOGIN) {
                this.connectionStage = ConnectionStage.LOGGED_IN;
                this.dataParser = new InboundPacketDataParser(this);
            }
        } catch(err) {
            console.error('Error decoding client data');
            console.error(err);
            this.socket.destroy();
        }
    }

    public connectionDestroyed(): void {
        if(this.player) {
            this.player.logout();
            world.deregisterPlayer(this.player);
        }
    }

    get connectionStage(): ConnectionStage {
        return this._connectionStage;
    }

    set connectionStage(value: ConnectionStage) {
        this._connectionStage = value;
    }

    get serverKey(): bigint {
        return this._serverKey;
    }

    set serverKey(value: bigint) {
        this._serverKey = value;
    }

    get clientKey1(): bigint {
        return this._clientKey1;
    }

    set clientKey1(value: bigint) {
        this._clientKey1 = value;
    }

    get clientKey2(): bigint {
        return this._clientKey2;
    }

    set clientKey2(value: bigint) {
        this._clientKey2 = value;
    }

    get player(): Player {
        return this._player;
    }

    set player(value: Player) {
        this._player = value;
    }
}
