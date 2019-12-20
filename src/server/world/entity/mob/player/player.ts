import { Socket } from 'net';
import { PacketSender } from '../../../../net/packet-sender';
import { Isaac } from '../../../../net/isaac';
import { PlayerUpdateTask } from './task/player-update-task';
import { Mob } from '../mob';
import { PlayerTickTask } from './task/player-tick-task';
import { PlayerResetTask } from './task/player-reset-task';
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
    public readonly playerTickTask: PlayerTickTask;
    public readonly playerUpdateTask: PlayerUpdateTask;
    public readonly playerResetTask: PlayerResetTask;
    public readonly updateFlags: UpdateFlags;

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
        this.playerTickTask = new PlayerTickTask(this);
        this.playerUpdateTask = new PlayerUpdateTask(this);
        this.playerResetTask = new PlayerResetTask(this);
        this.updateFlags = new UpdateFlags();
    }

    public init(): void {
        this.updateFlags.mapRegionUpdateRequired = true;
        this.updateFlags.appearanceUpdateRequired = true;

        this.position = new Position(3222, 3222);

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
        world.deregisterPlayer(this);
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
