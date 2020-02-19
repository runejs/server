import { Socket } from 'net';
import { PacketSender } from './packet/packet-sender';
import { Isaac } from '@server/net/isaac';
import { PlayerUpdateTask } from './updating/player-update-task';
import { Mob } from '../mob';
import { Position } from '@server/world/position';
import { world } from '@server/game-server';
import { logger } from '@runejs/logger';
import {
    Appearance,
    defaultAppearance, defaultSettings,
    loadPlayerSave,
    PlayerSave, PlayerSettings,
    savePlayerData
} from './player-data';
import { ActiveInterface, interfaceIds, interfaceSettings } from './game-interface';
import { ContainerUpdateEvent, ItemContainer } from '../../items/item-container';
import { EquipmentBonuses, ItemDetails } from '../../config/item-data';
import { Item } from '../../items/item';
import { Npc } from '../npc/npc';
import { NpcUpdateTask } from './updating/npc-update-task';
import { Subject } from 'rxjs';
import { Chunk, ChunkUpdateItem } from '@server/world/map/chunk';

const DEFAULT_TAB_INTERFACES = [
    2423, 3917, 638, 3213, 1644, 5608, 1151, -1, 5065, 5715, 2449, 904, 147, 962
];

export enum Rights {
    ADMIN = 2,
    MOD = 1,
    USER = 0
}

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
    private _rights: Rights;
    private loggedIn: boolean;
    public isLowDetail: boolean;
    private firstTimePlayer: boolean;
    private readonly _packetSender: PacketSender;
    public readonly playerUpdateTask: PlayerUpdateTask;
    public readonly npcUpdateTask: NpcUpdateTask;
    public trackedPlayers: Player[];
    public trackedNpcs: Npc[];
    private _appearance: Appearance;
    private _activeInterface: ActiveInterface;
    private readonly _equipment: ItemContainer;
    private _bonuses: EquipmentBonuses;
    private _carryWeight: number;
    private _settings: PlayerSettings;
    public readonly dialogueInteractionEvent: Subject<number>;
    private _walkingTo: Position;
    private _nearbyChunks: Chunk[];
    public readonly actionsCancelled: Subject<boolean>;

    public constructor(socket: Socket, inCipher: Isaac, outCipher: Isaac, clientUuid: number, username: string, password: string, isLowDetail: boolean) {
        super();
        this._socket = socket;
        this._inCipher = inCipher;
        this._outCipher = outCipher;
        this.clientUuid = clientUuid;
        this.username = username;
        this.password = password;
        this._rights = Rights.ADMIN;
        this.isLowDetail = isLowDetail;
        this._packetSender = new PacketSender(this);
        this.playerUpdateTask = new PlayerUpdateTask(this);
        this.npcUpdateTask = new NpcUpdateTask(this);
        this.trackedPlayers = [];
        this.trackedNpcs = [];
        this._activeInterface = null;
        this._carryWeight = 0;
        this._equipment = new ItemContainer(14);
        this.dialogueInteractionEvent = new Subject<number>();
        this._nearbyChunks = [];
        this.actionsCancelled = new Subject<boolean>();

        this.loadSaveData();
    }

    private loadSaveData(): void {
        const playerSave: PlayerSave = loadPlayerSave(this.username);
        const firstTimePlayer: boolean = playerSave === null;
        this.firstTimePlayer = firstTimePlayer;

        if(!firstTimePlayer) {
            // Existing player logging in
            this.position = new Position(playerSave.position.x, playerSave.position.y, playerSave.position.level);
            if(playerSave.inventory && playerSave.inventory.length !== 0) {
                this.inventory.setAll(playerSave.inventory);
            }
            if(playerSave.equipment && playerSave.equipment.length !== 0) {
                this.equipment.setAll(playerSave.equipment);
            }
            if(playerSave.skills && playerSave.skills.length !== 0) {
                this.skills.values = playerSave.skills;
            }
            this._appearance = playerSave.appearance;
            this._settings = playerSave.settings;
            this._rights = playerSave.rights || Rights.USER;
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
            this._rights = Rights.USER;
        }

        if(!this._settings) {
            this._settings = defaultSettings();
        }
    }

    public init(): void {
        this.loggedIn = true;
        this.updateFlags.mapRegionUpdateRequired = true;
        this.updateFlags.appearanceUpdateRequired = true;

        const playerChunk = world.chunkManager.getChunkForWorldPosition(this.position);
        playerChunk.addPlayer(this);

        this.packetSender.sendMembershipStatusAndWorldIndex();
        this.packetSender.updateCurrentMapChunk();
        this.chunkChanged(playerChunk);
        this.packetSender.chatboxMessage('Welcome to RuneScape.');

        DEFAULT_TAB_INTERFACES.forEach((interfaceId: number, tabIndex: number) => {
            if(interfaceId !== -1) {
                this.packetSender.sendTabInterface(tabIndex, interfaceId);
            }
        });

        this.skills.values.forEach((skill, index) => this.packetSender.sendSkill(index, skill.level, skill.exp));

        this.packetSender.sendUpdateAllInterfaceItems(interfaceIds.inventory, this.inventory);
        this.packetSender.sendUpdateAllInterfaceItems(interfaceIds.equipment, this.equipment);

        if(this.firstTimePlayer) {
            this.activeInterface = {
                interfaceId: interfaceIds.characterDesign,
                type: 'SCREEN',
                disablePlayerMovement: true
            };
        }

        this.updateBonuses();
        this.updateInterfaceSettings();
        this.updateCarryWeight(true);

        this.inventory.containerUpdated.subscribe(event => this.inventoryUpdated(event));

        this.actionsCancelled.subscribe(doNotCloseInterfaces => {
            if(!doNotCloseInterfaces) {
                this.packetSender.closeActiveInterfaces();
                this._activeInterface = null;
            }
        });

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

    /**
     * Should be fired whenever the player's chunk changes. This will fire off chunk updates for all chunks not
     * already tracked by the player - all the new chunks that are coming into view.
     * @param chunk The player's new active map chunk.
     */
    public chunkChanged(chunk: Chunk): void {
        const nearbyChunks = world.chunkManager.getSurroundingChunks(chunk);
        if(this._nearbyChunks.length === 0) {
            this.sendChunkUpdates(nearbyChunks);
        } else {
            const newChunks = nearbyChunks.filter(c1 => this._nearbyChunks.findIndex(c2 => c1.equals(c2)) === -1);
            this.sendChunkUpdates(newChunks);
        }

        this._nearbyChunks = nearbyChunks;
    }

    /**
     * Sends chunk updates to notify the client of added & removed landscape objects
     * @param chunks The chunks to update.
     */
    private sendChunkUpdates(chunks: Chunk[]): void {
        chunks.forEach(chunk => {
            this.packetSender.clearChunk(chunk);

            const chunkUpdateItems: ChunkUpdateItem[] = [];

            if(chunk.removedLandscapeObjects.size !== 0) {
                chunk.removedLandscapeObjects.forEach(object => chunkUpdateItems.push({ object, type: 'REMOVE' }));
            }

            if(chunk.addedLandscapeObjects.size !== 0) {
                chunk.addedLandscapeObjects.forEach(object => chunkUpdateItems.push({ object, type: 'ADD' }));
            }

            if(chunk.worldItems.size !== 0) {
                chunk.worldItems.forEach(worldItemList => {
                    if(worldItemList && worldItemList.length !== 0) {
                        worldItemList.forEach(worldItem => {
                            if(!worldItem.initiallyVisibleTo || worldItem.initiallyVisibleTo.equals(this)) {
                                chunkUpdateItems.push({worldItem, type: 'ADD'});
                            }
                        });
                    }
                });
            }

            if(chunkUpdateItems.length !== 0) {
                this.packetSender.updateChunk(chunk, chunkUpdateItems);
            }
        });
    }

    public async tick(): Promise<void> {
        return new Promise<void>(resolve => {
            this.walkingQueue.process();

            if(this.updateFlags.mapRegionUpdateRequired) {
                this.packetSender.updateCurrentMapChunk();
            }

            resolve();
        });
    }

    public async reset(): Promise<void> {
        return new Promise<void>(resolve => {
            this.updateFlags.reset();

            if(this.metadata['updateChunk']) {
                const { newChunk, oldChunk } = this.metadata['updateChunk'];
                oldChunk.removePlayer(this);
                newChunk.addPlayer(this);
                this.chunkChanged(newChunk);
                this.metadata['updateChunk'] = null;
            }

            if(this.metadata['teleporting']) {
                this.metadata['teleporting'] = null;
            }

            resolve();
        });
    }

    public teleport(newPosition: Position): void {
        const oldChunk = world.chunkManager.getChunkForWorldPosition(this.position);
        const newChunk = world.chunkManager.getChunkForWorldPosition(newPosition);

        this.walkingQueue.clear();
        this.position = newPosition;

        this.updateFlags.mapRegionUpdateRequired = true;
        this.lastMapRegionUpdatePosition = newPosition;
        this.metadata['teleporting'] = true;

        if(!oldChunk.equals(newChunk)) {
            this.metadata['updateChunk'] = { newChunk, oldChunk };
        }
    }

    public canMove(): boolean {
        return true;
    }

    public removeFirstItem(item: number | Item): number {
        const slot = this.inventory.removeFirst(item);

        if(slot === -1) {
            return -1;
        }

        this.packetSender.sendUpdateSingleInterfaceItem(interfaceIds.inventory, slot, null);
        return slot;
    }

    public removeItem(slot: number): void {
        this.inventory.remove(slot);

        this.packetSender.sendUpdateSingleInterfaceItem(interfaceIds.inventory, slot, null);
    }

    public giveItem(item: number | Item): boolean {
        const addedItem = this.inventory.add(item);
        if(addedItem === null) {
            return false;
        }

        this.packetSender.sendUpdateSingleInterfaceItem(interfaceIds.inventory, addedItem.slot, addedItem.item);
        return true;
    }

    public hasItemInEquipment(item: number | Item): boolean {
        return this._equipment.has(item);
    }

    public hasItemOnPerson(item: number | Item): boolean {
        return this.hasItemInInventory(item) || this.hasItemInEquipment(item);
    }

    private inventoryUpdated(event: ContainerUpdateEvent): void {
        this.updateCarryWeight();
    }

    public updateCarryWeight(force: boolean = false): void {
        const oldWeight = this._carryWeight;
        this._carryWeight = Math.round(this.inventory.weight() + this.equipment.weight());

        if(oldWeight !== this._carryWeight || force) {
            this.packetSender.updateCarryWeight(this._carryWeight);
        }
    }

    public settingChanged(buttonId: number): void {
        const settingsMappings = {
            152: {setting: 'runEnabled', value: false},
            153: {setting: 'runEnabled', value: true},
            930: {setting: 'musicVolume', value: 4},
            931: {setting: 'musicVolume', value: 3},
            932: {setting: 'musicVolume', value: 2},
            933: {setting: 'musicVolume', value: 1},
            934: {setting: 'musicVolume', value: 0},
            941: {setting: 'soundEffectVolume', value: 4},
            942: {setting: 'soundEffectVolume', value: 3},
            943: {setting: 'soundEffectVolume', value: 2},
            944: {setting: 'soundEffectVolume', value: 1},
            945: {setting: 'soundEffectVolume', value: 0},
            957: {setting: 'splitPrivateChatEnabled', value: true},
            958: {setting: 'splitPrivateChatEnabled', value: false},
            913: {setting: 'twoMouseButtonsEnabled', value: true},
            914: {setting: 'twoMouseButtonsEnabled', value: false},
            906: {setting: 'screenBrightness', value: 1},
            908: {setting: 'screenBrightness', value: 2},
            910: {setting: 'screenBrightness', value: 3},
            912: {setting: 'screenBrightness', value: 4},
            915: {setting: 'chatEffectsEnabled', value: true},
            916: {setting: 'chatEffectsEnabled', value: false},
            12464: {setting: 'acceptAidEnabled', value: true},
            12465: {setting: 'acceptAidEnabled', value: false},
            150: {setting: 'autoRetaliateEnabled', value: true},
            151: {setting: 'autoRetaliateEnabled', value: false}
        };

        if(!settingsMappings.hasOwnProperty(buttonId)) {
            return;
        }

        const config = settingsMappings[buttonId];
        this.settings[config.setting] = config.value;
    }

    public updateInterfaceSettings(): void {
        const settings = this.settings;
        this.packetSender.updateInterfaceSetting(interfaceSettings.brightness, settings.screenBrightness);
        this.packetSender.updateInterfaceSetting(interfaceSettings.mouseButtons, settings.twoMouseButtonsEnabled ? 0 : 1);
        this.packetSender.updateInterfaceSetting(interfaceSettings.splitPrivateChat, settings.splitPrivateChatEnabled ? 1 : 0);
        this.packetSender.updateInterfaceSetting(interfaceSettings.chatEffects, settings.chatEffectsEnabled ? 0 : 1);
        this.packetSender.updateInterfaceSetting(interfaceSettings.acceptAid, settings.acceptAidEnabled ? 1 : 0);
        this.packetSender.updateInterfaceSetting(interfaceSettings.musicVolume, settings.musicVolume);
        this.packetSender.updateInterfaceSetting(interfaceSettings.soundEffectVolume, settings.soundEffectVolume);
        this.packetSender.updateInterfaceSetting(interfaceSettings.runMode, settings.runEnabled ? 1 : 0);
        this.packetSender.updateInterfaceSetting(interfaceSettings.autoRetaliate, settings.autoRetaliateEnabled ? 0 : 1);
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
        const itemData: ItemDetails = world.itemData.get(item.itemId);

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
        this.activeInterface = null;
    }

    public equals(player: Player): boolean {
        return this.worldIndex === player.worldIndex && this.username === player.username && this.clientUuid === player.clientUuid;
    }

    public get socket(): Socket {
        return this._socket;
    }

    public get inCipher(): Isaac {
        return this._inCipher;
    }

    public get outCipher(): Isaac {
        return this._outCipher;
    }

    public get packetSender(): PacketSender {
        return this._packetSender;
    }

    public get rights(): Rights {
        return this._rights;
    }

    public get appearance(): Appearance {
        return this._appearance;
    }

    public set appearance(value: Appearance) {
        this._appearance = value;
    }

    public get activeInterface(): ActiveInterface {
        return this._activeInterface;
    }

    public set activeInterface(value: ActiveInterface) {
        if(value !== null) {
            if(value.type === 'SCREEN') {
                this.packetSender.showScreenInterface(value.interfaceId);
            } else if(value.type === 'CHAT') {
                this.packetSender.showChatboxInterface(value.interfaceId);
            }
        } else {
            this.packetSender.closeActiveInterfaces();
        }

        this.actionsCancelled.next(true);
        this._activeInterface = value;
    }

    public get equipment(): ItemContainer {
        return this._equipment;
    }

    public get carryWeight(): number {
        return this._carryWeight;
    }

    public get settings(): PlayerSettings {
        return this._settings;
    }

    public get walkingTo(): Position {
        return this._walkingTo;
    }

    public set walkingTo(value: Position) {
        this._walkingTo = value;
    }

    public get nearbyChunks(): Chunk[] {
        return this._nearbyChunks;
    }
}
