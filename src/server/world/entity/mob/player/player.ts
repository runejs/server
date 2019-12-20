import { Socket } from 'net';
import { PacketSender } from '../../../../net/packet-sender';
import { Isaac } from '../../../../net/isaac';
import { PlayerUpdateTask } from './task/player-update-task';
import { Mob } from '../mob';
import { UpdateFlags } from './update-flags';
import { Position } from '../../../position';
import { Skill, skills } from '../skills/skill';
import { world } from '../../../../game-server';

const DEFAULT_TAB_INTERFACES = [
    2423, 3917, 638, 3213, 1644, 5608, 1151, -1, 5065, 5715, 2449, 904, 147, 962
];

/**
 * A player character within the game world.
 */
export class Player extends Mob {

    private readonly _socket: Socket;
    private readonly _inCipher: Isaac;
    private readonly _outCipher: Isaac;
    public readonly clientUuid: number;
    public readonly username: string;
    private readonly password: string;
    public isLowDetail: boolean;
    private readonly _packetSender: PacketSender;
    public readonly playerUpdateTask: PlayerUpdateTask;
    public readonly updateFlags: UpdateFlags;
    public readonly trackedPlayers: Player[];

    public constructor(socket: Socket, inCipher: Isaac, outCipher: Isaac, clientUuid: number, username: string, password: string, isLowDetail: boolean) {
        super();
        this._socket = socket;
        this._inCipher = inCipher;
        this._outCipher = outCipher;
        this.clientUuid = clientUuid;
        this.username = username;
        this.password = password;
        this.isLowDetail = isLowDetail;
        this._packetSender = new PacketSender(this);
        this.playerUpdateTask = new PlayerUpdateTask(this);
        this.updateFlags = new UpdateFlags();
        this.trackedPlayers = [];
    }

    public init(): void {
        this.updateFlags.mapRegionUpdateRequired = true;
        this.updateFlags.appearanceUpdateRequired = true;

        this.position = new Position(3222, 3222);
        world.chunkManager.getChunkForWorldPosition(this.position).addPlayer(this);

        this.packetSender.sendMembershipStatusAndWorldIndex();
        this.packetSender.sendCurrentMapRegion();
        this.packetSender.sendChatboxMessage('Welcome to RuneScape.');

        DEFAULT_TAB_INTERFACES.forEach((interfaceId: number, tabIndex: number) => {
            if(interfaceId !== -1) {
                this.packetSender.sendTabInterface(tabIndex, interfaceId);
            }
        });

        skills.forEach((skill: Skill, index: number) => this.packetSender.sendSkill(index, 1, 0));
    }

    public logout(): void {
        this.packetSender.sendLogout();
        world.chunkManager.getChunkForWorldPosition(this.position).removePlayer(this);
        world.deregisterPlayer(this);
        console.log(`${this.username} has logged out.`);
    }

    public tick(): Promise<void> {
        return new Promise<void>(resolve => {
            this.walkingQueue.process();

            if(this.updateFlags.mapRegionUpdateRequired) {
                this.packetSender.sendCurrentMapRegion();
            }

            resolve();
        });
    }

    public reset(): Promise<void> {
        return new Promise<void>(resolve => {
            this.updateFlags.reset();
            resolve();
        });
    }

    public equals(player: Player): boolean {
        return this.worldIndex === player.worldIndex && this.username === player.username && this.clientUuid === player.clientUuid;
    }

    public get socket() {
        return this._socket;
    }

    public get inCipher() {
        return this._inCipher;
    }

    public get outCipher() {
        return this._outCipher;
    }

    public get packetSender() {
        return this._packetSender;
    }

}
