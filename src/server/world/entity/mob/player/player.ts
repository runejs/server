import { Socket } from 'net';
import { PacketSender } from './packet/packet-sender';
import { Isaac } from '../../../../net/isaac';
import { PlayerUpdateTask } from './task/player-update-task';
import { Mob } from '../mob';
import { UpdateFlags } from './update-flags';
import { Position } from '../../../position';
import { Skill, skills } from '../skills/skill';
import { world } from '../../../../game-server';
import { logger } from '@runejs/logger';

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
    private loggedIn: boolean;
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
        this.loggedIn = true;
        this.updateFlags.mapRegionUpdateRequired = true;
        this.updateFlags.appearanceUpdateRequired = true;

        this.position = new Position(3240, 3225);
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

        this.inventory.add({ itemId: 1351, amount: 1 });

        this.packetSender.sendUpdateAllInterfaceItems(3214, this.inventory);
    }

    public logout(): void {
        if(!this.loggedIn) {
            return;
        }

        this.packetSender.sendLogout();
        world.chunkManager.getChunkForWorldPosition(this.position).removePlayer(this);
        world.deregisterPlayer(this);
        this.loggedIn = false;

        logger.info(`${this.username} has logged out.`);
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
