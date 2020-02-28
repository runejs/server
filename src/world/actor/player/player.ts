import { AddressInfo, Socket } from 'net';
import { OutgoingPackets } from '../../../net/outgoing-packets';
import { Isaac } from '@server/net/isaac';
import { PlayerUpdateTask } from './updating/player-update-task';
import { Actor } from '../actor';
import { Position } from '@server/world/position';
import { serverConfig, world } from '@server/game-server';
import { logger } from '@runejs/logger';
import {
    Appearance,
    defaultAppearance, defaultSettings,
    loadPlayerSave,
    PlayerSave, PlayerSettings,
    savePlayerData, validateSettings
} from './player-data';
import { ActiveWidget, widgets, widgetSettings } from '../../config/widget';
import { ContainerUpdateEvent, ItemContainer } from '../../items/item-container';
import { EquipmentBonuses, ItemDetails } from '../../config/item-data';
import { Item } from '../../items/item';
import { Npc } from '../npc/npc';
import { NpcUpdateTask } from './updating/npc-update-task';
import { Subject } from 'rxjs';
import { Chunk, ChunkUpdateItem } from '@server/world/map/chunk';
import { QuadtreeKey } from '@server/world/world';
import { daysSinceLastLogin } from '@server/util/time';

const DEFAULT_TAB_WIDGET_IDS = [
    92, widgets.skillsTab, 274, widgets.inventory.widgetId, widgets.equipment.widgetId, 271, 192, -1, 131, 148, widgets.logoutTab, widgets.settingsTab, 464, 239
];

export enum Rights {
    ADMIN = 2,
    MOD = 1,
    USER = 0
}

/**
 * A player character within the game world.
 */
export class Player extends Actor {

    private readonly _socket: Socket;
    private readonly _inCipher: Isaac;
    private readonly _outCipher: Isaac;
    public readonly clientUuid: number;
    public readonly username: string;
    private readonly password: string;
    private _rights: Rights;
    private loggedIn: boolean;
    private _loginDate: Date;
    private _lastAddress: string;
    public isLowDetail: boolean;
    private firstTimePlayer: boolean;
    private readonly _outgoingPackets: OutgoingPackets;
    public readonly playerUpdateTask: PlayerUpdateTask;
    public readonly npcUpdateTask: NpcUpdateTask;
    public trackedPlayers: Player[];
    public trackedNpcs: Npc[];
    private _appearance: Appearance;
    private _activeWidget: ActiveWidget;
    private readonly _equipment: ItemContainer;
    private _bonuses: EquipmentBonuses;
    private _carryWeight: number;
    private _settings: PlayerSettings;
    public readonly dialogueInteractionEvent: Subject<number>;
    private _walkingTo: Position;
    private _nearbyChunks: Chunk[];
    public readonly actionsCancelled: Subject<boolean>;
    private quadtreeKey: QuadtreeKey = null;

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
        this._outgoingPackets = new OutgoingPackets(this);
        this.playerUpdateTask = new PlayerUpdateTask(this);
        this.npcUpdateTask = new NpcUpdateTask(this);
        this.trackedPlayers = [];
        this.trackedNpcs = [];
        this._activeWidget = null;
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

            const lastLogin = playerSave.lastLogin?.date;
            if(!lastLogin) {
                this._loginDate = new Date();
            } else {
                this._loginDate = new Date(lastLogin);
            }

            this._lastAddress = playerSave.lastLogin?.address || (this._socket?.address() as AddressInfo)?.address || '127.0.0.1';
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

        this.outgoingPackets.updateCurrentMapChunk();
        this.chunkChanged(playerChunk);
        this.outgoingPackets.chatboxMessage('Welcome to RuneJS #435.');

        DEFAULT_TAB_WIDGET_IDS.forEach((widgetId: number, tabIndex: number) => {
            if(widgetId !== -1) {
                this.outgoingPackets.sendTabWidget(tabIndex, widgetId);
            }
        });

        this.skills.values.forEach((skill, index) => this.outgoingPackets.updateSkill(index, skill.level, skill.exp));

        this.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, this.inventory);
        this.outgoingPackets.sendUpdateAllWidgetItems(widgets.equipment, this.equipment);

        if(this.firstTimePlayer) {
            this.activeWidget = {
                widgetId: widgets.characterDesign,
                type: 'SCREEN',
                disablePlayerMovement: true
            };
        } else if(serverConfig.showWelcome) {
            const daysSinceLogin = daysSinceLastLogin(this.loginDate);
            let loginDaysStr = '';

            if(daysSinceLogin <= 0) {
                loginDaysStr = 'earlier today';
            } else if(daysSinceLogin === 1) {
                loginDaysStr = 'yesterday';
            } else {
                loginDaysStr = daysSinceLogin + ' days ago';
            }
            this.outgoingPackets.updateWidgetString(widgets.welcomeScreenChildren.question, 1, `Want to help RuneJS improve?\\nSend us a pull request over on Github!`);
            this.outgoingPackets.updateWidgetString(widgets.welcomeScreen, 13, `You last logged in @red@${loginDaysStr}@bla@ from: @red@${this.lastAddress}`);
            this.outgoingPackets.updateWidgetString(widgets.welcomeScreen, 16, `You have @yel@0 unread messages\\nin your message centre.`);
            this.outgoingPackets.updateWidgetString(widgets.welcomeScreen, 14, `\\nYou have not yet set any recovery questions.\\nIt is @lre@strongly@yel@ recommended that you do so.\\n\\nIf you don't you will be @lre@unable to recover your\\n@lre@password@yel@ if you forget it, or it is stolen.`);
            this.outgoingPackets.updateWidgetString(widgets.welcomeScreen, 22, `To change your recovery questions:\\n1) Logout and return to the frontpage of this website.\\n2) Choose 'Set new recovery questions'.`);
            this.outgoingPackets.updateWidgetString(widgets.welcomeScreen, 17, `\\nYou do not have a Bank PIN.\\nPlease visit a bank if you would like one.`);
            this.outgoingPackets.updateWidgetString(widgets.welcomeScreen, 21, `To start a subscripton:\\n1) Logout and return to the frontpage of this website.\\n2) Choose 'Start a new subscription'`);
            this.outgoingPackets.updateWidgetString(widgets.welcomeScreen, 19, `You are not a member.\\n\\nChoose to subscribe and\\nyou'll get loads of extra\\nbenefits and features.`);

            this.activeWidget = {
                widgetId: widgets.welcomeScreen,
                secondaryWidgetId: widgets.welcomeScreenChildren.question,
                type: 'FULLSCREEN'
            };
        }

        validateSettings(this);
        this.updateWidgetSettings();
        this.updateBonuses();
        this.updateCarryWeight(true);

        this.inventory.containerUpdated.subscribe(event => this.inventoryUpdated(event));

        this.actionsCancelled.subscribe(doNotCloseWidgets => {
            if(!doNotCloseWidgets) {
                this.outgoingPackets.closeActiveWidgets();
                this._activeWidget = null;
            }
        });

        this._loginDate = new Date();
        this._lastAddress = (this._socket?.address() as AddressInfo)?.address || '127.0.0.1';

        this.outgoingPackets.flushQueue();

        logger.info(`${this.username}:${this.worldIndex} has logged in.`);
    }

    public logout(): void {
        if(!this.loggedIn) {
            return;
        }

        world.playerTree.remove(this.quadtreeKey);
        savePlayerData(this);

        this.outgoingPackets.logout();
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
            this.outgoingPackets.clearChunk(chunk);

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
                this.outgoingPackets.updateChunk(chunk, chunkUpdateItems);
            }
        });
    }

    public async tick(): Promise<void> {
        return new Promise<void>(resolve => {
            this.walkingQueue.process();

            if(this.updateFlags.mapRegionUpdateRequired) {
                this.outgoingPackets.updateCurrentMapChunk();
            }

            resolve();
        });
    }

    public async update(): Promise<void> {
        await Promise.all([ this.playerUpdateTask.execute(), this.npcUpdateTask.execute() ]);
    }

    public async reset(): Promise<void> {
        return new Promise<void>(resolve => {
            this.updateFlags.reset();

            this.outgoingPackets.flushQueue();

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

        this.outgoingPackets.sendUpdateSingleWidgetItem(widgets.inventory, slot, null);
        return slot;
    }

    public removeItem(slot: number): void {
        this.inventory.remove(slot);

        this.outgoingPackets.sendUpdateSingleWidgetItem(widgets.inventory, slot, null);
    }

    public giveItem(item: number | Item): boolean {
        const addedItem = this.inventory.add(item);
        if(addedItem === null) {
            return false;
        }

        this.outgoingPackets.sendUpdateSingleWidgetItem(widgets.inventory, addedItem.slot, addedItem.item);
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
            this.outgoingPackets.updateCarryWeight(this._carryWeight);
        }
    }

    public settingChanged(buttonId: number): void {
        const settingsMappings = {
            0: {setting: 'runEnabled', value: !this.settings['runEnabled']},
            1: {setting: 'chatEffectsEnabled', value: !this.settings['chatEffectsEnabled']},
            2: {setting: 'splitPrivateChatEnabled', value: !this.settings['splitPrivateChatEnabled']},
            3: {setting: 'twoMouseButtonsEnabled', value: !this.settings['twoMouseButtonsEnabled']},
            4: {setting: 'acceptAidEnabled', value: !this.settings['acceptAidEnabled']},
            // 5 is house options
            // 6 is unknown, might not even exist
            7: {setting: 'screenBrightness', value: 1},
            8: {setting: 'screenBrightness', value: 2},
            9: {setting: 'screenBrightness', value: 3},
            10: {setting: 'screenBrightness', value: 4},
            11: {setting: 'musicVolume', value: 4},
            12: {setting: 'musicVolume', value: 3},
            13: {setting: 'musicVolume', value: 2},
            14: {setting: 'musicVolume', value: 1},
            15: {setting: 'musicVolume', value: 0},
            16: {setting: 'soundEffectVolume', value: 4},
            17: {setting: 'soundEffectVolume', value: 3},
            18: {setting: 'soundEffectVolume', value: 2},
            19: {setting: 'soundEffectVolume', value: 1},
            20: {setting: 'soundEffectVolume', value: 0},
            29: {setting: 'areaEffectVolume', value: 4},
            30: {setting: 'areaEffectVolume', value: 3},
            31: {setting: 'areaEffectVolume', value: 2},
            32: {setting: 'areaEffectVolume', value: 1},
            33: {setting: 'areaEffectVolume', value: 0},
            // 150: {setting: 'autoRetaliateEnabled', value: true},
            // 151: {setting: 'autoRetaliateEnabled', value: false}
        };

        if(!settingsMappings.hasOwnProperty(buttonId)) {
            return;
        }

        const config = settingsMappings[buttonId];
        this.settings[config.setting] = config.value;
    }

    public updateWidgetSettings(): void {
        const settings = this.settings;
        this.outgoingPackets.updateClientConfig(widgetSettings.brightness, settings.screenBrightness);
        this.outgoingPackets.updateClientConfig(widgetSettings.mouseButtons, settings.twoMouseButtonsEnabled ? 0 : 1);
        this.outgoingPackets.updateClientConfig(widgetSettings.splitPrivateChat, settings.splitPrivateChatEnabled ? 1 : 0);
        this.outgoingPackets.updateClientConfig(widgetSettings.chatEffects, settings.chatEffectsEnabled ? 0 : 1);
        this.outgoingPackets.updateClientConfig(widgetSettings.acceptAid, settings.acceptAidEnabled ? 1 : 0);
        this.outgoingPackets.updateClientConfig(widgetSettings.musicVolume, settings.musicVolume);
        this.outgoingPackets.updateClientConfig(widgetSettings.soundEffectVolume, settings.soundEffectVolume);
        this.outgoingPackets.updateClientConfig(widgetSettings.areaEffectVolume, settings.areaEffectVolume);
        this.outgoingPackets.updateClientConfig(widgetSettings.runMode, settings.runEnabled ? 1 : 0);
        this.outgoingPackets.updateClientConfig(widgetSettings.autoRetaliate, settings.autoRetaliateEnabled ? 0 : 1);
        this.outgoingPackets.updateClientConfig(widgetSettings.attackStyle, settings.attackStyle);
        this.outgoingPackets.updateClientConfig(widgetSettings.bankInsertMode, settings.bankInsertMode);
    }

    public updateBonuses(): void {
        this.clearBonuses();

        for(const item of this._equipment.items) {
            if(item === null) {
                continue;
            }

            this.addBonuses(item);
        }
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

    public closeActiveWidget(notifyClient: boolean = true): void {
        if(notifyClient) {
            this.activeWidget = null;
        } else {
            this.actionsCancelled.next(true);
            this._activeWidget = null;
        }
    }

    public hasWidgetOpen(widgetId: number): boolean {
        return this.activeWidget && this.activeWidget.widgetId === widgetId;
    }

    public set position(position: Position) {
        super.position = position;

        if(this.quadtreeKey !== null) {
            world.playerTree.remove(this.quadtreeKey);
        }

        this.quadtreeKey = { x: position.x, y: position.y, actor: this };
        world.playerTree.push(this.quadtreeKey);
    }

    public get position(): Position {
        return super.position;
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

    public get outgoingPackets(): OutgoingPackets {
        return this._outgoingPackets;
    }

    public get loginDate(): Date {
        return this._loginDate;
    }

    public get lastAddress(): string {
        return this._lastAddress;
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

    public get activeWidget(): ActiveWidget {
        return this._activeWidget;
    }

    public set activeWidget(value: ActiveWidget) {
        if(value !== null) {
            if(value.type === 'SCREEN') {
                this.outgoingPackets.showScreenWidget(value.widgetId);
            } else if(value.type === 'CHAT') {
                this.outgoingPackets.showChatboxWidget(value.widgetId);
            } else if(value.type === 'FULLSCREEN') {
                this.outgoingPackets.showFullscreenWidget(value.widgetId, value.secondaryWidgetId);
            } else if(value.type === 'SCREEN_AND_TAB') {
                this.outgoingPackets.showScreenAndTabWidgets(value.widgetId, value.secondaryWidgetId);
            }
        } else {
            this.outgoingPackets.closeActiveWidgets();
        }

        this.actionsCancelled.next(true);
        this._activeWidget = value;
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

    public get bonuses(): EquipmentBonuses {
        return this._bonuses;
    }
}
