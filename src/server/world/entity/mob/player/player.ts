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
import {
    Appearance,
    defaultAppearance,
    loadPlayerSave,
    PlayerSave,
    savePlayerData
} from './player-data';
import { ActiveInterface, interfaceIds } from './game-interface';
import { ItemContainer } from '../items/item-container';
import { EquipmentBonuses, ItemData } from '../../../config/item-data';
import { Item } from '../items/item';

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
    private _appearance: Appearance;
    private _activeGameInterface: ActiveInterface;
    private readonly _equipment: ItemContainer;
    private _bonuses: EquipmentBonuses;

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
        this._activeGameInterface = null;
        this._equipment = new ItemContainer(14);
    }

    public init(): void {
        const playerSave: PlayerSave = loadPlayerSave(this.username);
        const firstTimePlayer: boolean = playerSave === null;

        if(!firstTimePlayer) {
            // Existing player logging in
            this.position = new Position(playerSave.position.x, playerSave.position.y, playerSave.position.level);
            if(playerSave.inventory && playerSave.inventory.length !== 0) {
                this.inventory.setAll(playerSave.inventory);
            }
            if(playerSave.equipment && playerSave.equipment.length !== 0) {
                this.equipment.setAll(playerSave.equipment);
            }
            this._appearance = playerSave.appearance;
        } else {
            // Brand new player logging in
            this.position = new Position(3222, 3222);
            this.inventory.add({itemId: 1351, amount: 1});
            this.inventory.add({itemId: 1048, amount: 1});
            this.inventory.add({itemId: 6623, amount: 1});
            this.inventory.add({itemId: 1079, amount: 1});
            this.inventory.add({itemId: 1127, amount: 1});
            this.inventory.add({itemId: 1303, amount: 1});
            this.inventory.add({itemId: 1319, amount: 1});
            this.inventory.add({itemId: 1201, amount: 1});
            this._appearance = defaultAppearance();
        }

        this.loggedIn = true;
        this.updateFlags.mapRegionUpdateRequired = true;
        this.updateFlags.appearanceUpdateRequired = true;

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

        this.packetSender.sendUpdateAllInterfaceItems(interfaceIds.inventory, this.inventory);
        this.packetSender.sendUpdateAllInterfaceItems(interfaceIds.equipment, this.equipment);

        if(firstTimePlayer) {
            this.activeGameInterface = {
                interfaceId: interfaceIds.characterDesign,
                canWalk: false
            };
        }

        this.updateBonuses();

        logger.info(`${this.username}:${this.worldIndex} has logged in.`);
    }

    public logout(): void {
        if(!this.loggedIn) {
            return;
        }

        savePlayerData(this);

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

    public updateBonuses(): void {
        this.clearBonuses();

        for(const item of this._equipment.items) {
            if(item === null) {
                continue;
            }

            this.addBonuses(item);
        }

        [
            { id: 1675, text: 'Stab', value: this._bonuses.offencive.stab },
            { id: 1676, text: 'Slash', value: this._bonuses.offencive.slash },
            { id: 1677, text: 'Crush', value: this._bonuses.offencive.crush },
            { id: 1678, text: 'Magic', value: this._bonuses.offencive.magic },
            { id: 1679, text: 'Range', value: this._bonuses.offencive.ranged },
            { id: 1680, text: 'Stab', value: this._bonuses.defencive.stab },
            { id: 1681, text: 'Slash', value: this._bonuses.defencive.slash },
            { id: 1682, text: 'Crush', value: this._bonuses.defencive.crush },
            { id: 1683, text: 'Magic', value: this._bonuses.defencive.magic },
            { id: 1684, text: 'Range', value: this._bonuses.defencive.ranged },
            { id: 1686, text: 'Strength', value: this._bonuses.skill.strength },
            { id: 1687, text: 'Prayer', value: this._bonuses.skill.prayer },
        ].forEach(bonus => this.updateBonusString(bonus.id, bonus.text, bonus.value));
    }

    private updateBonusString(interfaceChildId: number, text: string, value: number): void {
        const s = `${text}: ${value > 0 ? `+${value}` : value}`;
        this.packetSender.updateInterfaceString(interfaceChildId, s);
    }

    private addBonuses(item: Item): void {
        const itemData: ItemData = world.itemData.get(item.itemId);

        if(!itemData || !itemData.equipment || !itemData.equipment.bonuses) {
            return;
        }

        const bonuses = itemData.equipment.bonuses;

        if(bonuses.offencive) {
            [ 'speed', 'stab', 'slash', 'crush', 'magic', 'ranged' ].forEach(bonus => this._bonuses.offencive[bonus] += (!bonuses.offencive.hasOwnProperty(bonus) ? 0 : bonuses.offencive[bonus]));
        }

        if(bonuses.defencive) {
            [ 'stab', 'slash', 'crush', 'magic', 'ranged' ].forEach(bonus => this._bonuses.defencive[bonus] += (!bonuses.defencive.hasOwnProperty(bonus) ? 0 : bonuses.defencive[bonus]));
        }

        if(bonuses.skill) {
            [ 'strength', 'prayer' ].forEach(bonus => this._bonuses.skill[bonus] += (!bonuses.skill.hasOwnProperty(bonus) ? 0 : bonuses.skill[bonus]));
        }
    }

    private clearBonuses(): void {
        this._bonuses = {
            offencive: {
                speed: 0, stab: 0, slash: 0, crush: 0, magic: 0, ranged: 0
            },
            defencive: {
                stab: 0, slash: 0, crush: 0, magic: 0, ranged: 0
            },
            skill: {
                strength: 0, prayer: 0
            }
        };
    }

    public closeActiveInterface(): void {
        this.activeGameInterface = null;
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

    public get appearance(): Appearance {
        return this._appearance;
    }

    public set appearance(value: Appearance) {
        this._appearance = value;
    }

    public get activeGameInterface(): ActiveInterface {
        return this._activeGameInterface;
    }

    public set activeGameInterface(value: ActiveInterface) {
        if(value) {
            this.packetSender.sendOpenGameInterface(value.interfaceId);
        } else {
            this.packetSender.sendCloseActiveGameInterface();
        }

        this._activeGameInterface = value;
    }

    public get equipment(): ItemContainer {
        return this._equipment;
    }
}
