import { RsBuffer } from '../rs-buffer';
import { Player } from '../../world/entity/mob/player/player';
import BigInteger from 'bigi';
import { Isaac } from '../isaac';
import { world } from '../../game-server';
import { DataParser } from './data-parser';

const rsaModulus = BigInteger('170266381807335046121774073514220583891686029487165562794998484549236036467227923571770256617931840775621072487838687650522710227973331693237285456731778528244126984080232314114323601116304887478969296070648644633713088027922830600712492972687351204275625149978223159432963210789506993409208545916714905193639');
const rsaExponent = BigInteger('31203509142881083532135549536026158091323909503877229533688287512071034926677159101862255933437148078727999315122549979806872624518572719252123487161100228878873171056467121535866931732774025040968081211444869314564882437393129626503358454254239127049126004791971048533435696336368320230696811301756586515533');

/**
 * Parses the login packet from the game client.
 */
export class ClientLoginParser extends DataParser {

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
        const decrypted: RsBuffer = new RsBuffer(BigInteger.fromBuffer(encryptedBytes).modPow(rsaExponent, rsaModulus).toBuffer());

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
        outputBuffer.writeByte(2); // Player rights (user, mod, staff)
        outputBuffer.writeByte(0); // ???
        this.clientConnection.socket.write(outputBuffer.getData());

        world.registerPlayer(player);

        this.clientConnection.clientKey1 = BigInt(clientKey1);
        this.clientConnection.clientKey2 = BigInt(clientKey2);
        this.clientConnection.player = player;
    }
}
