import { AddressInfo, Socket } from 'net';
import uuidv4 from 'uuid/v4';
import { Subject } from 'rxjs';
import EventEmitter from 'events';

import { logger } from '@runejs/common';

import { filestore, serverConfig } from '@server/game';
import {
    findMusicTrack, findNpc, findSongIdByRegionId, musicRegions, equipmentIndex,
    EquipmentSlot, getEquipmentSlot, ItemDetails, findItem, findQuest,
    npcIdMap, widgets, NpcDetails, PlayerQuest, QuestKey, itemMap
} from '@engine/config';
import { daysSinceLastLogin, colors, hexToRgb, rgbTo16Bit,getVarbitMorphIndex } from '@engine/util';
import { OutboundPacketHandler, Isaac } from '@engine/net';
import { actionHookMap, questMap } from '@engine/plugins';

import { Position, QuadtreeKey, TileModifications, activeWorld, WorldInstance } from '@engine/world';
import { PlayerWidget, widgetScripts, itemIds, animationIds } from '@engine/world/config';
import { ContainerUpdateEvent, getItemFromContainer, ItemContainer, Item } from '@engine/world/items';
import { Chunk, ChunkUpdateItem } from '@engine/world/map';
import { PlayerCommandActionHook, regionChangeActionFactory } from '@engine/action';
import { MusicPlayerMode } from '@engine/world/sound';

import { Actor } from '../actor';
import {
    Appearance,
    defaultAppearance,
    defaultSettings,
    loadPlayerSave,
    playerExists,
    PlayerSave,
    PlayerSettings,
    savePlayerData
} from './player-data';
import { Cutscene } from './cutscenes';
import { InterfaceState } from '@engine/interface';
import { Quest } from './quest';
import { SendMessageOptions } from './model';
import { PlayerSyncTask, NpcSyncTask } from './sync';
import { dialogue } from '../dialogue';
import { Npc } from '../npc';
import { SkillName } from '../skills';
import { PlayerMetadata } from './metadata';


export const playerOptions: { option: string, index: number, placement: 'TOP' | 'BOTTOM' }[] = [
    {
        option: 'Trade with',
        index: 1,
        placement: 'TOP'
    },
    {
        option: 'Follow',
        index: 0,
        placement: 'BOTTOM'
    }
];

export const defaultPlayerTabWidgets = () => ([
    -1, widgets.skillsTab, widgets.questTab, widgets.inventory.widgetId,
    widgets.equipment.widgetId, widgets.prayerTab, widgets.standardSpellbookTab, null,
    widgets.friendsList, widgets.ignoreList, widgets.logoutTab, widgets.settingsTab, widgets.emotesTab,
    widgets.musicPlayerTab
]);

export enum SidebarTab {
    COMBAT,
    SKILL,
    QUEST,
    INVENTORY,
    EQUIMENT,
    PRAYER,
    MAGIC,
    FRIENDS,
    IGNORE,
    LOGOUT,
    SETTINGS,
    EMOTES,
    MUSIC
}

export enum Rights {
    ADMIN = 2,
    MOD = 1,
    USER = 0
}


/**
 * A player character within the game world.
 */
export class Player extends Actor {

    public readonly clientUuid: number;
    public readonly username: string;
    public readonly passwordHash: string;
    public readonly playerUpdateTask: PlayerSyncTask;
    public readonly npcUpdateTask: NpcSyncTask;
    public readonly numericInputEvent: Subject<number>;
    public readonly dialogueInteractionEvent: Subject<number>;
    public readonly personalInstance = new WorldInstance(uuidv4());
    public readonly interfaceState = new InterfaceState(this);
    public isLowDetail: boolean;
    public trackedPlayers: Player[];
    public trackedNpcs: Npc[];
    public savedMetadata: { [key: string]: any } = {};
    public sessionMetadata: { [key: string]: any } = {};
    public quests: PlayerQuest[] = [];
    public musicTracks: Array<number> = [ 0, 400, 547, 321 ];
    public achievements: string[] = [];
    public friendsList: string[] = [];
    public ignoreList: string[] = [];
    public cutscene: Cutscene | null = null;
    public playerEvents: EventEmitter = new EventEmitter();

    /**
     * Override the Actor's `metadata` property to provide a more specific type.
     *
     * You cannot guarantee that this will be populated with data, so you should always check for the existence of the
     * metadata you are looking for before using it.
     *
     * @author jameskmonger
     */
    public readonly metadata: (Actor['metadata'] & Partial<PlayerMetadata>) = {};

    private readonly _socket: Socket;
    private readonly _inCipher: Isaac;
    private readonly _outCipher: Isaac;
    private readonly _outgoingPackets: OutboundPacketHandler;
    private readonly _equipment: ItemContainer;
    private _rights: Rights;
    private _loginDate: Date;
    private _lastAddress: string;
    private firstTimePlayer: boolean;
    private _appearance: Appearance;
    private queuedWidgets: PlayerWidget[];
    private _carryWeight: number;
    private _settings: PlayerSettings;
    private _nearbyChunks: Chunk[];
    private quadtreeKey: QuadtreeKey | null = null;
    private privateMessageIndex: number = 1;


    public constructor(socket: Socket, inCipher: Isaac, outCipher: Isaac, clientUuid: number, username: string, password: string, isLowDetail: boolean) {
        super('player');

        this._socket = socket;
        this._inCipher = inCipher;
        this._outCipher = outCipher;
        this.clientUuid = clientUuid;
        this.username = username;
        this.passwordHash = password;
        this._rights = Rights.ADMIN;
        this.isLowDetail = isLowDetail;
        this._outgoingPackets = new OutboundPacketHandler(this);
        this.playerUpdateTask = new PlayerSyncTask(this);
        this.npcUpdateTask = new NpcSyncTask(this);
        this.trackedPlayers = [];
        this.trackedNpcs = [];
        this.queuedWidgets = [];
        this._carryWeight = 0;
        this._equipment = new ItemContainer(14);
        this.dialogueInteractionEvent = new Subject<number>();
        this.numericInputEvent = new Subject<number>();
        this._nearbyChunks = [];
        this.friendsList = [];
        this.ignoreList = [];

        this.loadSaveData();
    }

    public async init(): Promise<void> {
        super.init();

        this.updateFlags.mapRegionUpdateRequired = true;
        this.updateFlags.appearanceUpdateRequired = true;

        const playerChunk = activeWorld.chunkManager.getChunkForWorldPosition(this.position);
        playerChunk.addPlayer(this);

        this.outgoingPackets.updateCurrentMapChunk();
        this.outgoingPackets.chatboxMessage('Welcome to RuneJS.');

        this.skills.values.forEach((skill, index) =>
            this.outgoingPackets.updateSkill(index, this.skills.getLevel(index), skill.exp));

        this.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, this.inventory);
        this.outgoingPackets.sendUpdateAllWidgetItems(widgets.equipment, this.equipment);
        for(const item of this.equipment.items) {
            if(item) {
                await this.actionPipeline.call('equipment_change', this, item.itemId, 'EQUIP');
            }
        }

        if(this.firstTimePlayer) {
            if(!serverConfig.tutorialEnabled) {
                this.interfaceState.openWidget(widgets.characterDesign, {
                    slot: 'screen',
                    multi: false
                });
            }
        } else if(serverConfig.showWelcome && (!serverConfig.tutorialEnabled || this.savedMetadata.tutorialComplete)) {
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

            this.interfaceState.openWidget(widgets.welcomeScreen, {
                slot: 'full',
                containerId: widgets.welcomeScreenChildren.question
            });
        }

        for(const playerOption of playerOptions) {
            this.outgoingPackets.updatePlayerOption(playerOption.option, playerOption.index, playerOption.placement);
        }

        this.updateBonuses();
        this.updateCarryWeight(true);
        this.updateQuestTab();
        this.updateMusicTab();

        this.inventory.containerUpdated.subscribe(event => this.inventoryUpdated(event));
        this.playerEvents.on('exp', (amt) => {
            logger.info(`Player should have been awarded ${amt} exp if this was hooked up.`);
        });

        this.actionsCancelled.subscribe(type => {
            let closeWidget: boolean;

            if(type === 'manual-movement' || type === 'pathing-movement') {
                closeWidget = true;
            } else if(type === 'keep-widgets-open' || type === 'button' || type === 'widget') {
                closeWidget = false;
            } else {
                closeWidget = true;
            }

            if(closeWidget) {
                this.interfaceState.closeAllSlots();
            }
        });

        this._loginDate = new Date();
        this._lastAddress = (this._socket?.address() as AddressInfo)?.address || '127.0.0.1';

        if(this.rights === Rights.ADMIN) {
            this.sendCommandList(actionHookMap.player_command as PlayerCommandActionHook[]);
        }
        this.outgoingPackets.resetAllClientConfigs();

        await this.actionPipeline.call('player_init', { player: this });

        activeWorld.spawnWorldItems(this);

        if(!this.metadata.customMap) {
            this.chunkChanged(playerChunk);
        }

        this.outgoingPackets.flushQueue();
        logger.info(`${this.username}:${this.worldIndex} has logged in.`);
    }

    public logout(): void {
        if(!this.active) {
            return;
        }

        if(this.position.level > 3) {
            this.position.level = 0;
        }

        if (this.quadtreeKey) {
            activeWorld.playerTree.remove(this.quadtreeKey);
        } else {
            // TODO (Jameskmonger) remove this log if it isn't a problem state
            logger.warn(`Player ${this.username} has no quadtree key on logout.`);
        }

        this.save();

        this.destroy();

        this.actionsCancelled.complete();
        this.walkingQueue.movementEvent.complete();
        this.walkingQueue.movementQueued.complete();
        this.actionPipeline.shutdown();
        this.outgoingPackets.logout();
        this.instance = null;
        activeWorld.chunkManager.getChunkForWorldPosition(this.position).removePlayer(this);
        activeWorld.deregisterPlayer(this);

        logger.info(`${this.username} has logged out.`);
    }

    public save(): void {
        savePlayerData(this);
    }

    public privateMessageReceived(fromPlayer: Player, messageBytes: number[]): void {
        this.outgoingPackets.sendPrivateMessage(this.privateMessageIndex++, fromPlayer, messageBytes);
    }

    public addFriend(friendName: string): boolean {
        if(!playerExists(friendName)) {
            return false;
        }

        friendName = friendName.toLowerCase();
        this.friendsList.push(friendName);
        return true;
    }

    public removeFriend(friendName: string): boolean {
        friendName = friendName.toLowerCase();
        const index = this.friendsList.findIndex(friend => friend === friendName);
        if(index === -1) {
            return false;
        }

        this.friendsList.splice(index, 1);
        return true;
    }

    public addIgnoredPlayer(playerName: string): boolean {
        if(!playerExists(playerName)) {
            return false;
        }

        playerName = playerName.toLowerCase();
        // @TODO emit event to friend service watcher
        return this.ignoreList.findIndex(ignoredPlayer => ignoredPlayer === playerName) === -1;
    }

    public removeIgnoredPlayer(playerName: string): boolean {
        playerName = playerName.toLowerCase();
        const index = this.ignoreList.findIndex(ignoredPlayer => ignoredPlayer === playerName);
        if(index === -1) {
            return false;
        }

        // @TODO emit event to friend service watcher
        this.ignoreList.splice(index, 1);
        return true;
    }
    public onNpcKill(npc: Npc) {
        console.log('killed npc');
    }
    /**
     * Should be fired whenever the player's chunk changes. This will fire off chunk updates for all chunks not
     * already tracked by the player - all the new chunks that are coming into view.
     * @param chunk The player's new active map chunk.
     */
    public chunkChanged(chunk: Chunk): void {
        const nearbyChunks = activeWorld.chunkManager.getSurroundingChunks(chunk);
        if(this._nearbyChunks.length === 0) {
            this.sendChunkUpdates(nearbyChunks);
        } else {
            const newChunks = nearbyChunks.filter(c1 => this._nearbyChunks.findIndex(c2 => c1.equals(c2)) === -1);
            this.sendChunkUpdates(newChunks);
        }
        this._nearbyChunks = nearbyChunks;
    }

    public async tick(): Promise<void> {
        super.tick();

        return new Promise<void>(resolve => {
            this.walkingQueue.process();

            if(this.updateFlags.mapRegionUpdateRequired) {
                if(this.position.x >= 6400) { // Custom map drawing area is anywhere x >= 6400 on the map
                    if (this.metadata.customMap) {
                        this.outgoingPackets.constructMapRegion(this.metadata.customMap);
                    } else {
                        logger.warn(`Player ${this.username} is in custom map area but has no custom map set.`);
                    }
                } else {
                    this.outgoingPackets.updateCurrentMapChunk();
                }
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

            if(this.metadata.updateChunk) {
                const { newChunk, oldChunk } = this.metadata.updateChunk;
                oldChunk.removePlayer(this);
                newChunk.addPlayer(this);
                this.chunkChanged(newChunk);
                this.metadata.updateChunk = undefined;
            }

            if(this.metadata.teleporting) {
                this.metadata.teleporting = undefined;
            }

            resolve();
        });
    }

    /**
     * Fetches the player's number of quest points based off of their completed quests.
     */
    public getQuestPoints(): number {
        let questPoints = 0;

        if(this.quests && this.quests.length !== 0) {
            this.quests.filter(quest => quest.complete)
                .forEach(quest => questPoints += questMap[quest.questId]?.points || 0);
        }

        return questPoints;
    }

    /**
     * Fetches a player's quest progression details.
     * @param questId The ID of the quest to find the player's status on.
     */
    public getQuest(questId: string): PlayerQuest {
        let playerQuest = this.quests.find(quest => quest.questId === questId);
        if(!playerQuest) {
            playerQuest = new PlayerQuest(questId);
            this.quests.push(playerQuest);
        }

        return playerQuest;
    }

    /**
     * Checks if the player has unlocked the required stage of a quest
     * @param questId The ID of the quest to find the player's status on.
     * @param minimumStage The minimum quest stage required, defaults to completed
     * @return boolean if the player has reached the required stage, if the quest does not exist it defaults to true
     */
    public hasQuestRequirement(questId: string, minimumStage: QuestKey = 'complete'): boolean {
        if(!questMap[questId]) {
            logger.warn(`Quest data not found for ${questId}`);
            return true;
        }
        let playerQuest = this.quests.find(quest => quest.questId === questId);
        if(!playerQuest) {
            playerQuest = new PlayerQuest(questId);
            this.quests.push(playerQuest);
        }
        return playerQuest.progress === minimumStage || playerQuest.progress >= minimumStage;
    }

    /**
     * Sets a player's quest progress to the specified value.
     * @param questId The ID of the quest to set the progress of.
     * @param progress The progress to set the quest to.
     */
    public setQuestProgress(questId: string, progress: QuestKey): void {
        const questData = findQuest(questId);

        if(!questData) {
            logger.warn(`Quest data not found for ${questId}`);
            return;
        }

        let playerQuest = this.quests.find(quest => quest.questId === questId);
        if(!playerQuest) {
            playerQuest = new PlayerQuest(questId);
            this.quests.push(playerQuest);
        }

        if(playerQuest.progress === 0 && !playerQuest.complete) {
            playerQuest.progress = progress;
            this.modifyWidget(widgets.questTab, { childId: questData.questTabId, textColor: colors.yellow });
        } else if(!playerQuest.complete && progress === 'complete') {
            playerQuest.complete = true;
            playerQuest.progress = 'complete';
            this.outgoingPackets.updateClientConfig(widgetScripts.questPoints, questData.points + this.getQuestPoints());
            this.modifyWidget(widgets.questReward, { childId: 2, text: `You have completed ${questData.name}!` });
            this.modifyWidget(widgets.questReward, {
                childId: 8,
                text: `${questData.points} Quest Point${questData.points > 1 ? 's' : ''}`
            });

            for(let i = 0; i < 5; i++) {
                if(i >= questData.onComplete.questCompleteWidget.rewardText.length) {
                    this.modifyWidget(widgets.questReward, { childId: 9 + i, text: '' });
                } else {
                    this.modifyWidget(widgets.questReward, {
                        childId: 9 + i,
                        text: questData.onComplete.questCompleteWidget.rewardText[i]
                    });
                }
            }

            if(questData.onComplete.questCompleteWidget.itemId) {
                const cacheItemData = filestore.configStore.itemStore.getItem(questData.onComplete.questCompleteWidget.itemId);

                if (cacheItemData && cacheItemData.model2d.widgetModel) {
                    this.outgoingPackets.updateWidgetModel1(widgets.questReward, 3, cacheItemData.model2d.widgetModel);
                }


            } else if(questData.onComplete.questCompleteWidget.modelId) {
                this.outgoingPackets.updateWidgetModel1(widgets.questReward, 3, questData.onComplete.questCompleteWidget.modelId);
            }

            this.outgoingPackets.setWidgetModelRotationAndZoom(widgets.questReward, 3,
                questData.onComplete.questCompleteWidget.modelRotationX || 0,
                questData.onComplete.questCompleteWidget.modelRotationY || 0,
                questData.onComplete.questCompleteWidget.modelZoom || 0);

            this.interfaceState.openWidget(widgets.questReward, {
                slot: 'screen',
                multi: false
            });

            this.modifyWidget(widgets.questTab, { childId: questData.questTabId, textColor: colors.green });

            if(questData.onComplete.giveRewards) {
                questData.onComplete.giveRewards(this);
            }
        } else {
            playerQuest.progress = progress;
        }
    }

    /**
     * Modifies the specified widget using the provided options.
     * @param widgetId The widget id of the widget to modify.
     * @param options The options with which to modify the widget.
     */
    public modifyWidget(widgetId: number, options: { childId?: number, text?: string, hidden?: boolean, textColor?: number }): void {
        const { childId, text, hidden, textColor } = options;

        if(childId !== undefined) {
            if(text !== undefined) {
                this.outgoingPackets.updateWidgetString(widgetId, childId, text);
            }
            if(hidden !== undefined) {
                this.outgoingPackets.toggleWidgetVisibility(widgetId, childId, hidden);
            }
            if(textColor !== undefined) {
                const { r, g, b } = hexToRgb(textColor);
                this.outgoingPackets.updateWidgetColor(widgetId, childId, rgbTo16Bit(r, g, b));
            }
        }
    }

    /**
     * Sets the player's specified sidebar widget to the given widget id.
     * @param sidebarId The sidebar to change.
     * @param widgetId The widget to insert into the sidebar.
     */
    public setSidebarWidget(sidebarId: SidebarTab, widgetId: number | null): void {
        this.outgoingPackets.sendTabWidget(sidebarId, widgetId || null);
    }

    /**
     * Plays the given song for the player.
     * @param songId The id of the song to play.
     */
    public playSong(songId: number): void {
        const musicTrack = findMusicTrack(songId);
        if(!musicTrack) {
            logger.warn(`Music track not found for id ${songId}`);
            return;
        }

        this.modifyWidget(widgets.musicPlayerTab, {
            childId: 177,
            text: musicTrack.songName,
            textColor: colors.green
        });
        this.savedMetadata['currentSongIdPlaying'] = songId;
        this.outgoingPackets.playSong(songId);
    }

    /**
     * Plays a sound for this specific player.
     * @param soundId The id of the sound effect.
     * @param volume The volume to play the sound at; defaults to 10 (max).
     * @param delay The delay after which to play the sound; defaults to 0 (no delay).
     */
    public playSound(soundId: number, volume: number = 10, delay: number = 0): void {
        this.outgoingPackets.playSound(soundId, volume, delay);
    }

    /**
     * Sends a message to the player via the chat-box.
     * @param messages The single message or array of lines to send to the player.
     * @param showDialogue Whether or not to show the message in a "Click to continue" dialogue.
     * @returns A Promise<void> that resolves when the player has clicked the "click to continue" button or
     * after their chat messages have been sent.
     */
    public async sendMessage(messages: string | string[], showDialogue?: boolean): Promise<boolean>;

    /**
     * Sends a message to the player via the chat-box (and the debug console if specified).
     * @param messages The single message or array of lines to send to the player.
     * @param options A list of options to provide for sending the message - includes values for `dialogue` and `console`
     * to enable sending the message as a dialogue message and/or adding the message to the debug console.
     * @returns A Promise<void> that resolves when the player has clicked the "click to continue" button or
     * after their chat messages have been sent.
     */
    public async sendMessage(messages: string | string[], options?: SendMessageOptions): Promise<boolean>;

    public async sendMessage(messages: string | string[], options?: boolean | SendMessageOptions): Promise<boolean> {
        if(!Array.isArray(messages)) {
            messages = [ messages ];
        }

        let showDialogue = false;
        let showInConsole = false;
        if(options) {
            if(typeof options === 'boolean') {
                showDialogue = true;
            } else {
                showDialogue = options.dialogue || false;
                showInConsole = options.console || false;
            }
        }

        if(!showDialogue) {
            messages.forEach(message => this.outgoingPackets.chatboxMessage(message));
        } else {
            for(let i = 0; i < messages.length; i++) {
                messages[i] = messages[i]?.trim() || '';
            }

            return await dialogue([ this ], [
                text => (messages as string[]).join(' ')
            ]);
        }

        if(showInConsole) {
            messages.forEach(message => this.outgoingPackets.consoleMessage(message));
        }

        return true;
    }

    /**
     * Instantly teleports the player to the specified location.
     * @param newPosition The player's new position.
     * @param updateRegion Whether or not to sync the player's map region with their client. Defaults to true.
     */
    public teleport(newPosition: Position, updateRegion: boolean = true): void {
        this.walkingQueue.clear();
        const originalPosition = this.position.copy();
        this.metadata.lastPosition = originalPosition;
        this.position = newPosition;
        this.metadata.teleporting = true;

        this.updateFlags.mapRegionUpdateRequired = updateRegion;
        this.lastMapRegionUpdatePosition = newPosition;

        const oldChunk = activeWorld.chunkManager.getChunkForWorldPosition(originalPosition);
        const newChunk = activeWorld.chunkManager.getChunkForWorldPosition(newPosition);

        if(!oldChunk.equals(newChunk)) {
            oldChunk.removePlayer(this);
            newChunk.addPlayer(this);
            this.metadata.updateChunk = { newChunk, oldChunk };

            if(updateRegion) {
                this.actionPipeline.call('region_change', regionChangeActionFactory(
                    this, originalPosition, newPosition, true));
            }
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

    public hasCoins(amount: number): number {
        return this.inventory.items
            .findIndex(item => item !== null && item.itemId === itemIds.coins && item.amount >= amount);
    }

    public removeItem(slot: number): void {
        this.inventory.remove(slot);
        this.outgoingPackets.sendUpdateSingleWidgetItem(widgets.inventory, slot, null);
    }

    public giveItem(item: number | Item | string): boolean {
        const addedItem = this.inventory.add(item);
        if(addedItem === null) {
            return false;
        }

        this.outgoingPackets.sendUpdateSingleWidgetItem(widgets.inventory, addedItem.slot, addedItem.item);
        return true;
    }

    public hasItemOnPerson(item: number | Item): boolean {
        return this.hasItemInInventory(item) || this.isItemEquipped(item);
    }

    /**
     * Updates the player's carry weight based off of their held items (inventory + equipment).
     * @param force Whether or not to force send an updated carry weight to the game client.
     */
    public updateCarryWeight(force: boolean = false): void {
        const oldWeight = this._carryWeight;
        this._carryWeight = Math.round(this.inventory.weight() + this.equipment.weight());

        if(oldWeight !== this._carryWeight || force) {
            this.outgoingPackets.updateCarryWeight(this._carryWeight);
        }
    }

    /**
     * Updates a player's client settings based off of which setting button they've clicked.
     * @param buttonId The ID of the setting button.
     * @TODO refactor to better match the 400+ widget system
     */
    public settingChanged(buttonId: number): void {
        const settingsMappings = {
            0: { setting: 'runEnabled', value: !this.settings['runEnabled'] },
            1: { setting: 'chatEffectsEnabled', value: !this.settings['chatEffectsEnabled'] },
            2: { setting: 'splitPrivateChatEnabled', value: !this.settings['splitPrivateChatEnabled'] },
            3: { setting: 'twoMouseButtonsEnabled', value: !this.settings['twoMouseButtonsEnabled'] },
            4: { setting: 'acceptAidEnabled', value: !this.settings['acceptAidEnabled'] },
            // 5 is house options
            // 6 is unknown, might not even exist
            7: { setting: 'screenBrightness', value: 1 },
            8: { setting: 'screenBrightness', value: 2 },
            9: { setting: 'screenBrightness', value: 3 },
            10: { setting: 'screenBrightness', value: 4 },
            11: { setting: 'musicVolume', value: 4 },
            12: { setting: 'musicVolume', value: 3 },
            13: { setting: 'musicVolume', value: 2 },
            14: { setting: 'musicVolume', value: 1 },
            15: { setting: 'musicVolume', value: 0 },
            16: { setting: 'soundEffectVolume', value: 4 },
            17: { setting: 'soundEffectVolume', value: 3 },
            18: { setting: 'soundEffectVolume', value: 2 },
            19: { setting: 'soundEffectVolume', value: 1 },
            20: { setting: 'soundEffectVolume', value: 0 },
            29: { setting: 'areaEffectVolume', value: 4 },
            30: { setting: 'areaEffectVolume', value: 3 },
            31: { setting: 'areaEffectVolume', value: 2 },
            32: { setting: 'areaEffectVolume', value: 1 },
            33: { setting: 'areaEffectVolume', value: 0 },
            // 150: {setting: 'autoRetaliateEnabled', value: true},
            // 151: {setting: 'autoRetaliateEnabled', value: false}
        };

        if(!settingsMappings[buttonId]) {
            return;
        }

        const config = settingsMappings[buttonId];
        this.settings[config.setting] = config.value;
    }

    /**
     * Updates the player's combat bonuses based off of their equipped items.
     */
    public updateBonuses(): void {
        this.clearBonuses();

        for(const item of this._equipment.items) {
            if(item === null) {
                continue;
            }

            this.addBonuses(item);
        }
    }

    public sendLogMessage(message: string, isConsole: boolean): void {
        if(isConsole) {
            this.outgoingPackets.consoleMessage(message);
        } else {
            this.outgoingPackets.chatboxMessage(message);
        }
    }

    public sendCommandList(commands: PlayerCommandActionHook[]): void {
        if(!commands || commands.length === 0) {
            return;
        }

        for(const command of commands) {
            let strCmd: string;
            if(Array.isArray(command.commands)) {
                strCmd = command.commands.join('|');
            } else {
                strCmd = command.commands;
            }
            let strHelp: string = '';
            if(command.args) {
                for(const arg of command.args) {
                    if(arg.defaultValue !== undefined) {
                        strHelp = `${strHelp} \\<${arg.name} = ${arg.defaultValue}>`;
                    } else {
                        strHelp = `${strHelp} \\<${arg.name}>`;
                    }
                }
            }
            this.outgoingPackets.sendConsoleCommand(strCmd, strHelp);
        }
    }

    public isItemEquipped(item: number | Item | string): boolean {
        if(typeof item === 'string') {
            item = findItem(item)?.gameId || 0;
            if(!item) {
                return false;
            }
        }
        return this._equipment.has(item);
    }

    public getEquippedItem(equipmentSlot: EquipmentSlot): Item | null {
        return this.equipment.items[equipmentIndex(equipmentSlot)] || null;
    }


    /**
     * Check if a player can equip an item
     * @param item either an ItemDetails instance or the string id of the item to be checked
     * @return {equipable: boolean, missingRequirements: string[]} equipable is false if for any reason the item can not
     * be equipped, if it can not be equipped, a list of reasons are attached as the missingRequirements array
     *
     * defaults to equipable=true if the item string id does not exist
     */
    public canEquipItem(item: ItemDetails | string): { equipable: boolean, missingRequirements?: string[] } {
        if(typeof item === 'string') {
            item = itemMap[item];
            if(!item) {
                return { equipable: true }
            }
        }
        const missingRequirements: string[] = [];
        const requirements = item.equipmentData?.requirements;
        if (!requirements) return { equipable: true };

        missingRequirements.push(
            ...Object.entries(requirements.skills || {})
                .filter(([skill, level]) => !this.skills.hasLevel(skill as SkillName, level))
                .map(([skill, level]) => `You need to be at least level ${level} ${skill} to equip this item.`),
            ...Object.entries(requirements.quests || {})
                .filter(([quest, stage]) => this.hasQuestRequirement(quest, stage))
                .map(([quest]) => `You must progress further in the ${quest.replace(/^([a-z]+:)/gm, '').replace(/_/g, ' ')} quest to equip this item.`)
        );

        return { equipable: missingRequirements.length === 0, missingRequirements: missingRequirements };
    }

    public equipItem(itemId: number, itemSlot: number, slot: EquipmentSlot | number): boolean {
        const itemToEquip = getItemFromContainer(itemId, itemSlot, this.inventory);

        if(!itemToEquip) {
            // The specified item was not found in the specified slot.
            return false;
        }

        let slotIndex: number;
        if(typeof slot === 'number') {
            slotIndex = slot;
            slot = getEquipmentSlot(slotIndex);
        } else {
            slotIndex = equipmentIndex(slot);
        }

        const itemToUnequip = this.equipment.items[slotIndex];
        let shouldUnequipOffHand = false;
        let shouldUnequipMainHand = false;
        const itemDetails = findItem(itemId);

        if(!itemDetails || !itemDetails.equipmentData || !itemDetails.equipmentData.equipmentSlot) {
            this.sendMessage(`Unable to equip item ${itemId}: Missing equipment data.`);
            return false;
        }

        const equippable = this.canEquipItem(itemDetails);
        if (!equippable.equipable) {
            if(equippable.missingRequirements) {
                equippable.missingRequirements.forEach(async (s) => this.sendMessage(s));
            }
            return false;
        }

        if(itemDetails && itemDetails.equipmentData) {
            if(itemDetails.equipmentData.equipmentType === 'two_handed') {
                shouldUnequipOffHand = true;
            }

            const mainHandEquipped = this.getEquippedItem('main_hand');

            if(slot === 'off_hand' && mainHandEquipped) {
                const mainHandItemData = findItem(mainHandEquipped.itemId);

                if(mainHandItemData && mainHandItemData.equipmentData && mainHandItemData.equipmentData.equipmentType === 'two_handed') {
                    shouldUnequipMainHand = true;
                }
            }
        }

        if(itemToUnequip) {
            if(shouldUnequipOffHand && !this.unequipItem('off_hand', false)) {
                return false;
            }

            if(shouldUnequipMainHand && !this.unequipItem('main_hand', false)) {
                return false;
            }

            this.actionPipeline.call('equipment_change', this, itemToUnequip.itemId, 'UNEQUIP', slot);

            this.equipment.remove(slotIndex, false);
            this.inventory.remove(itemSlot, false);

            this.equipment.set(slotIndex, itemToEquip);
            this.inventory.set(itemSlot, itemToUnequip);

        } else {
            this.equipment.set(slotIndex, itemToEquip);
            this.inventory.remove(itemSlot);

            if(shouldUnequipOffHand) {
                this.unequipItem('off_hand');
            }

            if(shouldUnequipMainHand) {
                this.unequipItem('main_hand');
            }
        }

        this.actionPipeline.call('equipment_change', this, itemId, 'equip', slot);
        this.equipmentChanged();
        return true;
    }

    public equipmentChanged(): void {
        this.updateBonuses();

        // @TODO change packets to only update modified container slots
        this.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, this.inventory);
        this.outgoingPackets.sendUpdateAllWidgetItems(widgets.equipment, this.equipment);

        if(this.interfaceState.widgetOpen('screen', widgets.equipmentStats.widgetId)) {
            this.outgoingPackets.sendUpdateAllWidgetItems(widgets.equipmentStats, this.equipment);
            this.syncBonuses();
        }

        this.updateFlags.appearanceUpdateRequired = true;
    }

    public syncBonuses(): void {
        [
            { id: 108, text: 'Stab', value: this.bonuses.offensive.stab },
            { id: 109, text: 'Slash', value: this.bonuses.offensive.slash },
            { id: 110, text: 'Crush', value: this.bonuses.offensive.crush },
            { id: 111, text: 'Magic', value: this.bonuses.offensive.magic },
            { id: 112, text: 'Range', value: this.bonuses.offensive.ranged },
            { id: 113, text: 'Stab', value: this.bonuses.defensive.stab },
            { id: 114, text: 'Slash', value: this.bonuses.defensive.slash },
            { id: 115, text: 'Crush', value: this.bonuses.defensive.crush },
            { id: 116, text: 'Magic', value: this.bonuses.defensive.magic },
            { id: 117, text: 'Range', value: this.bonuses.defensive.ranged },
            { id: 119, text: 'Strength', value: this.bonuses.skill.strength },
            { id: 120, text: 'Prayer', value: this.bonuses.skill.prayer },
        ].forEach(bonus => this.modifyWidget(widgets.equipmentStats.widgetId, { childId: bonus.id,
            text: `${bonus.text}: ${(bonus.value || 0) > 0 ? `+${bonus.value}` : bonus.value}` }));
    }

    public unequipItem(slot: EquipmentSlot | number, updateRequired: boolean = true): boolean {
        const inventorySlot = this.inventory.getFirstOpenSlot();
        if(inventorySlot === -1) {
            this.sendMessage(`You don't have enough free space to do that.`);
            return false;
        }

        let slotIndex: number;
        if(typeof slot === 'number') {
            slotIndex = slot;
            slot = getEquipmentSlot(slotIndex);
        } else {
            slotIndex = equipmentIndex(slot);
        }

        const itemInSlot = this.equipment.items[slotIndex];

        if(!itemInSlot) {
            return true;
        }

        this.actionPipeline.call('equipment_change', this, itemInSlot.itemId, 'unequip', slot);

        this.equipment.remove(slotIndex);
        this.inventory.set(inventorySlot, itemInSlot);
        if(updateRequired) {
            this.equipmentChanged();
        }
        return true;
    }

    /**
     * Transform's the player's appearance into the specified NPC.
     * @param npc The NPC to copy the appearance of, or null to reset.
     */
    public transformInto(npc: Npc | NpcDetails | string | number | null): void {
        if(!npc) {
            delete this.savedMetadata.npcTransformation;
            this.updateFlags.appearanceUpdateRequired = true;
            return;
        }

        if(typeof npc !== 'number') {
            if(typeof npc === 'string') {
                if(npc.indexOf(':') !== -1) {
                    npc = npcIdMap[npc];
                } else {
                    npc = parseInt(npc, 10);
                }
            } else if(npc instanceof Npc) {
                npc = npc.id;
            } else {
                npc = npc.gameId;
            }
        }

        if(!npc) {
            logger.error(`NPC not found.`);
            return;
        }

        this.savedMetadata.npcTransformation = npc;
        this.updateFlags.appearanceUpdateRequired = true;
    }

    /**
     * Returns the morphed NPC details for a specific player based on his client settings
     * @param originalNpc
     */
    public getMorphedNpcDetails(originalNpc: Npc) {
        if (!originalNpc.childrenIds) {
            return null;
        }

        let morphIndex: number;
        if (originalNpc.varbitId !== -1) {
            morphIndex = getVarbitMorphIndex(originalNpc.varbitId, this.metadata.configs);
        } else if (originalNpc.settingId !== -1) {
            morphIndex = this.metadata.configs && this.metadata.configs[originalNpc.settingId] ? this.metadata.configs[originalNpc.settingId] : 0;
        } else {
            logger.warn(`Tried to fetch a child NPC index, but but no varbitId or settingId were found in the NPC details. NPC: ${originalNpc.id}, childrenIDs: ${originalNpc.childrenIds}`);
            return null;
        }

        const npcDetails = findNpc(originalNpc.childrenIds[morphIndex]);
        if (!npcDetails) {
            logger.warn(`Fetched a morphed NPC, but it isn't yet registered on the server. (id-${originalNpc.id}) (morphedId-${originalNpc.childrenIds[morphIndex]})`);

            return;
        }
        return npcDetails;
    }

    public equals(player: Player): boolean {
        return this.worldIndex === player.worldIndex && this.username === player.username && this.clientUuid === player.clientUuid;
    }

    private inventoryUpdated(event: ContainerUpdateEvent): void {
        if(event.type === 'CLEAR_ALL') {
            this.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, this.inventory);
        } else if(event.type === 'ADD') {
            if (event.slot !== undefined && event.item !== undefined) {
                this.outgoingPackets.sendUpdateSingleWidgetItem(widgets.inventory, event.slot, event.item);
            } else {
                logger.error(`Inventory update event was missing slot or item.`, event);
            }

        }
        this.updateCarryWeight();
    }

    /**
     * Sends chunk updates to notify the client of added & removed location objects
     * @param chunks The chunks to update.
     */
    private sendChunkUpdates(chunks: Chunk[]): void {
        const instance = this.instance;

        if (!instance) {
            logger.error(`Player ${this.username} tried to send chunk updates without an instance.`);
            return;
        }

        chunks.forEach(chunk => {
            this.outgoingPackets.clearChunk(chunk);

            const chunkUpdateItems: ChunkUpdateItem[] = [];

            const chunkModifications = instance
                .getInstancedChunk(chunk.position.x, chunk.position.y, chunk.position.level) || null;
            const personalChunkModifications = this.personalInstance?.getInstancedChunk(chunk.position.x,
                chunk.position.y, chunk.position.level) || null;

            this.findChunkUpdates(chunkModifications?.mods, chunkUpdateItems);
            this.findChunkUpdates(personalChunkModifications?.mods, chunkUpdateItems);

            if(chunkUpdateItems.length !== 0) {
                this.outgoingPackets.updateChunk(chunk, chunkUpdateItems);
            }
        });
    }

    private findChunkUpdates(chunkMods: Map<string, TileModifications>, chunkUpdateItems: ChunkUpdateItem[]): void {
        if(!chunkMods) {
            return;
        }

        Array.from(chunkMods.values()).forEach(worldMods => {
            worldMods.hiddenObjects?.forEach(object =>
                chunkUpdateItems.push({ object, type: 'REMOVE' }));

            worldMods.spawnedObjects?.forEach(object =>
                chunkUpdateItems.push({ object, type: 'ADD' }));

            worldMods.worldItems?.forEach(worldItem => {
                if(!worldItem.owner || worldItem.owner.equals(this)) {
                    chunkUpdateItems.push({ worldItem, type: 'ADD' });
                }
            });
        });
    }

    /**
     * Updates the player's quest tab progress.
     */
    private updateQuestTab(): void {
        this.outgoingPackets.updateClientConfig(widgetScripts.questPoints, this.getQuestPoints());

        if(!questMap) {
            return;
        }
        Object.keys(questMap).forEach(questKey => {
            const questData = questMap[questKey];
            const playerQuest = this.quests.find(quest => quest.questId === questData.id);

            let color: number;

            if (playerQuest?.complete) {
                // Quest complete, regardless of progress
                color = colors.green;
            } else if ((playerQuest?.progress || 0) > 0) {
                // Quest in progress, not yet complete but progress is greater than 0
                color = colors.yellow;
            } else {
                // Everything else failed, so quest hasn't been started yet
                color = colors.red;
            }

            this.modifyWidget(widgets.questTab, { childId: questData.questTabId, textColor: color });
        });
    }

    /**
     * Updates the player's music tab progress.
     */
    private updateMusicTab(): void {
        if(!this.savedMetadata['currentSongIdPlaying']) {
            this.savedMetadata['currentSongIdPlaying'] =
                findSongIdByRegionId(activeWorld.chunkManager.getRegionIdForWorldPosition(
                    this.position));
        }

        if(this.settings.musicPlayerMode === MusicPlayerMode.MANUAL) {
            this.playSong(this.savedMetadata['currentSongIdPlaying']);
        }

        Object.keys(musicRegions).forEach(key => {
            const musicData = musicRegions[key];
            let color = colors.red;

            if(this.musicTracks.includes(musicData.songId)) {
                color = colors.green;
            }

            this.modifyWidget(widgets.musicPlayerTab, { childId: musicData.musicTabButtonId, textColor: color });
        });
    }

    private addBonuses(item: Item): void {
        const itemData = findItem(item.itemId);

        if(!itemData || !itemData.equipmentData) {
            return;
        }

        const offensiveBonuses = itemData.equipmentData.offensiveBonuses;
        const defensiveBonuses = itemData.equipmentData.defensiveBonuses;
        const skillBonuses = itemData.equipmentData.skillBonuses;

        if(offensiveBonuses) {
            [ 'speed', 'stab', 'slash', 'crush', 'magic', 'ranged' ].forEach(bonus =>
                this.bonuses.offensive[bonus] += (!offensiveBonuses[bonus] ? 0 : offensiveBonuses[bonus]));
        }

        if(defensiveBonuses) {
            [ 'stab', 'slash', 'crush', 'magic', 'ranged' ].forEach(bonus =>
                this.bonuses.defensive[bonus] += (!defensiveBonuses[bonus] ? 0 : defensiveBonuses[bonus]));
        }

        if(skillBonuses) {
            [ 'strength', 'prayer' ].forEach(bonus => this.bonuses.skill[bonus] +=
                (!skillBonuses[bonus] ? 0 : skillBonuses[bonus]));
        }
    }

    private loadSaveData(): void {
        const playerSave = loadPlayerSave(this.username);
        const firstTimePlayer = playerSave === null;
        this.firstTimePlayer = firstTimePlayer;

        if(!firstTimePlayer) {
            if(playerSave.savedMetadata) {
                this.savedMetadata = playerSave.savedMetadata;
            }

            // Existing player logging in
            this.position = new Position(playerSave.position.x, playerSave.position.y, playerSave.position.level);
            if(playerSave.inventory && playerSave.inventory.length !== 0) {
                this.inventory.setAll(playerSave.inventory);
            }
            if(playerSave.bank && playerSave.bank.length !== 0) {
                this.bank.setAll(playerSave.bank);
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

            if(playerSave.questList) {
                this.quests = playerSave.questList;
            }
            if(playerSave.musicTracks) {
                this.musicTracks = playerSave.musicTracks;
            }
            if(playerSave.achievements) {
                this.achievements = playerSave.achievements;
            }
            if(playerSave.friendsList) {
                this.friendsList = playerSave.friendsList;
            }
            if(playerSave.ignoreList) {
                this.ignoreList = playerSave.ignoreList;
            }

            this._lastAddress = playerSave.lastLogin?.address || (this._socket?.address() as AddressInfo)?.address || '127.0.0.1';
        } else {
            // Brand new player logging in
            this.position = new Position(3231, 3239);
            this._appearance = defaultAppearance();
            this._rights = Rights.USER;
            this.savedMetadata = {
                tutorialProgress: 0,
                tutorialComplete: false
            };
        }

        if(!this._settings) {
            this._settings = defaultSettings();
        }
    }

    public set position(position: Position) {
        super.position = position;

        if(this.quadtreeKey !== null) {
            activeWorld.playerTree.remove(this.quadtreeKey);
        }

        this.quadtreeKey = { x: position.x, y: position.y, actor: this };
        activeWorld.playerTree.push(this.quadtreeKey);
    }

    public get position(): Position {
        return super.position;
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

    public get outgoingPackets(): OutboundPacketHandler {
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

    public get equipment(): ItemContainer {
        return this._equipment;
    }


    public get carryWeight(): number {
        return this._carryWeight;
    }

    public get settings(): PlayerSettings {
        return this._settings;
    }

    public get nearbyChunks(): Chunk[] {
        return this._nearbyChunks;
    }

    public get instance(): WorldInstance {
        return super.instance;
    }

    public set instance(value: WorldInstance | null) {
        if(this.instance?.instanceId) {
            this.instance.removePlayer(this);
        }

        if(value) {
            value.addPlayer(this);
        }

        this._instance = value;
    }

}
