import { Player, SidebarTab } from '../world/actor/player/player';
import { Socket } from 'net';
import { Packet, PacketType } from '@engine/net/packet';
import { ItemContainer } from '@engine/world/items/item-container';
import { Item } from '@engine/world/items/item';
import { Position } from '@engine/world/position';
import { Chunk, ChunkUpdateItem } from '@engine/world/map/chunk';
import { WorldItem } from '@engine/world/items/world-item';
import { ByteBuffer } from '@runejs/core/buffer';
import { Npc } from '@engine/world/actor/npc/npc';
import { stringToLong } from '@engine/util/strings';
import { LandscapeObject } from '@runejs/filestore';
import { xteaRegions } from '@engine/config';
import { world } from '@engine/game-server';
import { ConstructedChunk, ConstructedRegion } from '@engine/world/map/region';



/**
 * A helper class for sending various network packets back to the game client.
 */
export class OutboundPackets {

    private static privateMessageCounter: number = Math.floor(Math.random() * 100000000);

    private readonly player: Player;
    private readonly socket: Socket;
    private updatingQueue: Buffer[];
    private packetQueue: Buffer[];

    public constructor(player: Player) {
        this.updatingQueue = [];
        this.packetQueue = [];
        this.player = player;
        this.socket = player.socket;
    }

    public resetCamera(): void {
        this.queue(new Packet(7));
    }

    public snapCameraTo(position: Position, height: number, speed: number, acceleration: number): void {
        const packet = new Packet(253);
        this.putCameraPosition(packet, position, height, speed, acceleration);
        this.queue(packet);
    }

    public turnCameraTowards(position: Position, height: number, speed: number, acceleration: number): void {
        const packet = new Packet(234);
        this.putCameraPosition(packet, position, height, speed, acceleration);
        this.queue(packet);
    }

    public updateSocialSettings(): void {
        const packet = new Packet(196);
        packet.put(this.player.settings.publicChatMode || 0);
        packet.put(this.player.settings.privateChatMode || 0);
        packet.put(this.player.settings.tradeMode || 0);
        this.queue(packet);
    }

    public sendPrivateMessage(chatId: number, sender: Player, message: number[]): void {
        const packet = new Packet(51, PacketType.DYNAMIC_SMALL);
        packet.put(stringToLong(sender.username.toLowerCase()), 'LONG');
        packet.put(32767, 'SHORT');
        packet.put(OutboundPackets.privateMessageCounter++, 'INT24');
        packet.put(sender.rights);
        packet.putBytes(Buffer.from(message));
        this.queue(packet);
    }

    public updateFriendStatus(friendName: string, worldId: number): void {
        const packet = new Packet(156);
        packet.put(stringToLong(friendName.toLowerCase()), 'LONG');
        packet.put(worldId, 'SHORT');
        this.queue(packet);
    }

    public sendFriendServerStatus(status: 0 | 1 | 2): void {
        // 0 = loading, 1 = connecting to friend server, 2 = friend list
        const packet = new Packet(70);
        packet.put(status);
        this.queue(packet);
    }

    public playSong(songId: number): void {
        const packet = new Packet(217);
        packet.put(songId, 'SHORT', 'LITTLE_ENDIAN');
        this.queue(packet);
    }

    public playQuickSong(songId: number, previousSongId: number): void {
        const packet = new Packet(40);
        packet.put(previousSongId, 'INT24');
        packet.put(songId, 'SHORT');

        this.queue(packet);
    }

    public playSound(soundId: number, volume: number, delay: number = 0): void {
        const packet = new Packet(131);
        packet.put(soundId, 'SHORT');
        packet.put(volume);
        packet.put(delay, 'SHORT');

        this.queue(packet);
    }

    public playSoundAtPosition(soundId: number, soundX: number, soundY: number, volume: number, radius: number = 5, delay: number = 0): void {
        const packet = new Packet(9);
        const offset = 0;
        packet.put(offset, 'BYTE');
        packet.put(soundId, 'SHORT');
        packet.put((volume & 7) + (radius << 4), 'BYTE');
        packet.put(delay, 'BYTE');

        this.queue(packet);
    }

    public updateChunk(chunk: Chunk, chunkUpdates: ChunkUpdateItem[]): void {
        const { offsetX, offsetY } = this.getChunkOffset(chunk);

        const packet = new Packet(63, PacketType.DYNAMIC_LARGE);
        packet.put(offsetX);
        packet.put(offsetY);

        chunkUpdates.forEach(update => {
            if(update.type === 'ADD') {
                if(update.object && !update.object.reference) {
                    const offset = this.getChunkPositionOffset(update.object.x, update.object.y, chunk);
                    packet.put(241, 'BYTE');
                    packet.put((update.object.type << 2) + (update.object.orientation & 3));
                    packet.put(update.object.objectId, 'SHORT');
                    packet.put(offset);
                } else if(update.worldItem) {
                    const offset = this.getChunkPositionOffset(update.worldItem.position.x, update.worldItem.position.y, chunk);
                    packet.put(175, 'BYTE');
                    packet.put(update.worldItem.itemId, 'SHORT', 'LITTLE_ENDIAN');
                    packet.put(update.worldItem.amount, 'SHORT');
                    packet.put(offset, 'BYTE');
                }
            } else if(update.type === 'REMOVE') {
                const offset = this.getChunkPositionOffset(update.object.x, update.object.y, chunk);
                packet.put(143, 'BYTE');
                packet.put(offset);
                packet.put((update.object.type << 2) + (update.object.orientation & 3));
            }
        });

        this.queue(packet);
    }

    public clearChunk(chunk: Chunk): void {
        const { offsetX, offsetY } = this.getChunkOffset(chunk);

        const packet = new Packet(64);
        packet.put(offsetY, 'BYTE');
        packet.put(offsetX);

        this.queue(packet);
    }

    public setWorldItem(worldItem: WorldItem, position: Position, offset: number = 0): void {
        this.updateReferencePosition(position);

        const packet = new Packet(175);
        packet.put(worldItem.itemId, 'SHORT', 'LITTLE_ENDIAN');
        packet.put(worldItem.amount, 'SHORT');
        packet.put(offset, 'BYTE');

        this.queue(packet);
    }

    public removeWorldItem(worldItem: WorldItem, position: Position, offset: number = 0): void {
        this.updateReferencePosition(position);

        const packet = new Packet(74);
        packet.put(offset, 'BYTE');
        packet.put(worldItem.itemId, 'SHORT');

        this.queue(packet);
    }

    public setLocationObject(locationObject: LandscapeObject, position: Position, offset: number = 0): void {
        this.updateReferencePosition(position);

        const packet = new Packet(241);
        packet.put((locationObject.type << 2) + (locationObject.orientation & 3));
        packet.put(locationObject.objectId, 'SHORT');
        packet.put(offset);

        this.queue(packet);
    }

    public removeLocationObject(locationObject: LandscapeObject, position: Position, offset: number = 0): void {
        this.updateReferencePosition(position);

        const packet = new Packet(143);
        packet.put(offset);
        packet.put((locationObject.type << 2) + (locationObject.orientation & 3));

        this.queue(packet);
    }

    public updateReferencePosition(position: Position): void {
        const offsetX = position.x - (this.player.lastMapRegionUpdatePosition.chunkX * 8);
        const offsetY = position.y - (this.player.lastMapRegionUpdatePosition.chunkY * 8);

        const packet = new Packet(254);
        packet.put(offsetY);
        packet.put(offsetX);

        this.queue(packet);
    }

    // Text dialogs = 356, 359, 363, 368, 374
    // Item dialogs = 519
    // Statements (no click to continue) = 210, 211, 212, 213, 214
    public showChatboxWidget(widgetId: number): void {
        const packet = new Packet(208);
        packet.put(widgetId, 'SHORT');

        this.queue(packet);
    }

    public setWidgetNpcHead(widgetId: number, childId: number, modelId: number): void {
        const packet = new Packet(160);
        packet.put(modelId, 'SHORT', 'LITTLE_ENDIAN');
        packet.put(widgetId << 16 | childId, 'INT', 'LITTLE_ENDIAN');

        this.queue(packet);
    }

    public setWidgetPlayerHead(widgetId: number, childId: number): void {
        const packet = new Packet(210);
        packet.put(widgetId << 16 | childId, 'INT', 'LITTLE_ENDIAN');

        this.queue(packet);
    }

    public playWidgetAnimation(widgetId: number, childId: number, animationId: number): void {
        const packet = new Packet(24);
        packet.put(animationId, 'SHORT');
        packet.put(widgetId << 16 | childId, 'INT');

        this.queue(packet);
    }

    public showScreenAndTabWidgets(widgetId: number, tabWidgetId: number): void {
        const packet = new Packet(84);
        packet.put(tabWidgetId, 'SHORT');
        packet.put(widgetId, 'SHORT', 'LITTLE_ENDIAN');
        this.queue(packet);
    }

    public resetAllClientConfigs(): void {
        const packet = new Packet(14);
        this.queue(packet);
    }

    public updateClientConfig(configId: number, value: number): void {
        let packet: Packet;
        const metadata = this.player.metadata;
        if(!metadata['configs']) {
            metadata['configs'] = []
        }
        metadata.configs[configId] = value;

        if(value > 128) {
            packet = new Packet(2);
            packet.put(value, 'INT');
            packet.put(configId, 'SHORT');
        } else {
            packet = new Packet(222);
            packet.put(value);
            packet.put(configId, 'SHORT');
        }

        this.queue(packet);
    }

    public setWidgetModelRotationAndZoom(widgetId: number, childId: number, rotationX: number, rotationY: number, zoom: number): void {
        const packet = new Packet(142);
        packet.put(rotationX, 'SHORT');
        packet.put(zoom, 'SHORT', 'LITTLE_ENDIAN');
        packet.put(rotationY, 'SHORT');
        packet.put(widgetId << 16 | childId, 'INT', 'LITTLE_ENDIAN');

        this.queue(packet);
    }

    public updateWidgetModel1(widgetId: number, childId: number, modelId: number): void {
        const packet = new Packet(250);
        packet.put(modelId, 'SHORT', 'LITTLE_ENDIAN');
        packet.put(widgetId << 16 | childId, 'INT', 'LITTLE_ENDIAN');

        this.queue(packet);
    }

    public updateWidgetItemModel(widgetId: number, itemId: number, scale?: number): void {
        const packet = new Packet(21);
        packet.put(scale, 'SHORT');
        packet.put(itemId, 'SHORT', 'LITTLE_ENDIAN');
        packet.put(widgetId, 'SHORT', 'LITTLE_ENDIAN');

        this.queue(packet);
    }

    public updateWidgetString(widgetId: number, childId: number, value: string): void {
        const packet = new Packet(110, PacketType.DYNAMIC_LARGE);
        packet.put(widgetId << 16 | childId, 'INT', 'LITTLE_ENDIAN');
        packet.putString(value);

        this.queue(packet);
    }

    public updateWidgetColor(widgetId: number, childId: number, color: number): void {
        const packet = new Packet(231);
        packet.put(color, 'SHORT');
        packet.put(widgetId << 16 | childId, 'INT', 'LITTLE_ENDIAN');

        this.queue(packet);
    }

    public closeActiveWidgets(): void {
        this.queue(new Packet(180));
    }

    public showScreenOverlayWidget(widgetId: number): void {
        const packet = new Packet(56);
        packet.put(widgetId, 'SHORT');
        this.queue(packet);
    }

    public showStandaloneScreenWidget(widgetId: number): void {
        const packet = new Packet(118);
        packet.put(widgetId, 'SHORT');
        this.queue(packet);
    }

    // @TODO this can support multiple items/slots !!!
    public sendUpdateSingleWidgetItem(widget: { widgetId: number, containerId: number }, slot: number, item: Item): void {
        const packet = new Packet(214, PacketType.DYNAMIC_LARGE);
        packet.put(widget.widgetId << 16 | widget.containerId, 'INT');
        packet.put(slot, 'SMART');

        if(!item) {
            packet.put(0, 'SHORT');
        } else {
            packet.put(item.itemId + 1, 'SHORT'); // +1 because 0 means an empty slot

            if(item.amount >= 255) {
                packet.put(255, 'BYTE');
                packet.put(item.amount, 'INT');
            } else {
                packet.put(item.amount, 'BYTE');
            }
        }

        this.queue(packet);
    }

    public update(packet: Packet, widget: { widgetId: number, containerId: number }, container: ItemContainer): void {
        const packed = widget.widgetId << 16 | widget.containerId;
        packet.put(packed, 'INT');

        const size = container.size;
        packet.put(size, 'SHORT');

        const bound = container.items.length * 7;
        const payload = new Packet(-1, PacketType.FIXED, bound); //TODO: change default value of allocatedSize from 5000 to something reasonable (64 - 256 as most RS packets are quite small)

        for (let index = 0; index < size; index += 8) {
            const { bitset, buffer } = this.segment(container, index);

            payload.put(bitset, 'BYTE');

            if (bitset == 0) {
                continue;
            }

            payload.putBytes(buffer);
        }

        packet.putBytes(this.strip(payload));

        this.queue(packet);
    }

    public sendUpdateAllWidgetItems(widget: { widgetId: number, containerId: number }, container: ItemContainer): void {
        const packet = new Packet(12, PacketType.DYNAMIC_LARGE);
        this.update(packet, widget, container);
    }

    public sendUpdateAllWidgetItemsById(widget: { widgetId: number, containerId: number }, itemIds: number[]): void {
        const container = new ItemContainer(itemIds.length);
        const items = itemIds.map(id => (!id ? null : { itemId: id, amount: 1 }));
        container.setAll(items, false);

        this.sendUpdateAllWidgetItems(widget, container);
    }

    public setItemOnWidget(widgetId: number, childId: number, itemId: number, zoom: number): void {
        const packet = new Packet(120);
        packet.put(zoom, 'SHORT');
        packet.put(itemId, 'SHORT', 'LITTLE_ENDIAN');
        packet.put(widgetId << 16 | childId, 'INT', 'LITTLE_ENDIAN');

        this.queue(packet);
    }

    public toggleWidgetVisibility(widgetId: number, childId: number, hidden: boolean): void {
        const packet = new Packet(115);
        packet.put(hidden ? 1 : 0, 'BYTE');
        packet.put(widgetId << 16 | childId, 'INT', 'LITTLE_ENDIAN');

        this.queue(packet);
    }

    public moveWidgetChild(widgetId: number, childId: number, offsetX: number, offsetY: number): void {
        const packet = new Packet(3);
        packet.put(widgetId << 16 | childId, 'INT');
        packet.put(offsetY, 'SHORT', 'LITTLE_ENDIAN');
        packet.put(offsetX, 'SHORT', 'LITTLE_ENDIAN');

        this.queue(packet);
    }

    public showTabWidget(widgetId: number): void {
        const packet = new Packet(237);
        packet.put(widgetId, 'SHORT');
        this.queue(packet);
    }

    public sendTabWidget(tabIndex: SidebarTab, widgetId: number | null): void {
        if(widgetId < 0) {
            return;
        }

        const packet = new Packet(140);
        packet.put(widgetId === null || widgetId === -1 ? 65535 : widgetId, 'SHORT');
        packet.put(tabIndex);

        this.queue(packet);
    }

    public blinkTabIcon(tabIndex: number): void {
        const packet = new Packet(88);
        packet.put(tabIndex);
        this.queue(packet);
    }

    public showFullscreenWidget(widgetId: number, secondaryWidgetId: number): void {
        const packet = new Packet(195);
        packet.put(secondaryWidgetId, 'SHORT');
        packet.put(widgetId, 'SHORT');

        this.queue(packet);
    }

    public showNumberInputDialogue(): void {
        const packet = new Packet(132);
        this.queue(packet);
    }

    public showTextInputDialogue(): void {
        const packet = new Packet(124);
        this.queue(packet);
    }

    public showChatDialogue(widgetId: number): void {
        const packet = new Packet(185);
        packet.put(widgetId, 'SHORT');
        this.queue(packet);
    }

    public updateCarryWeight(weight: number): void {
        const packet = new Packet(171);
        packet.put(weight, 'SHORT');

        this.queue(packet);
    }

    public showHintIcon(iconType: 2 | 3 | 4 | 5 | 6, position: Position, offset: number = 0): void {
        const packet = new Packet(186);
        packet.put(iconType, 'BYTE');
        packet.put(position.x, 'SHORT');
        packet.put(position.y, 'SHORT');
        packet.put(offset, 'BYTE');

        this.queue(packet);
    }

    public showPlayerHintIcon(player: Player): void {
        const packet = new Packet(186);
        packet.put(10, 'BYTE');
        packet.put(player.worldIndex, 'SHORT');

        // Packet requires a length of 6, so send some extra junk
        packet.put(0);
        packet.put(0);
        packet.put(0);

        this.queue(packet);
    }

    public showNpcHintIcon(npc: Npc): void {
        const packet = new Packet(186);
        packet.put(1, 'BYTE');
        packet.put(npc.worldIndex, 'SHORT');

        // Packet requires a length of 6, so send some extra junk
        packet.put(0);
        packet.put(0);
        packet.put(0);

        this.queue(packet);
    }

    public resetNpcHintIcon(): void {
        const packet = new Packet(186);
        packet.put(1, 'BYTE');
        packet.put(-1, 'SHORT');

        // Packet requires a length of 6, so send some extra junk
        packet.put(0);
        packet.put(0);
        packet.put(0);

        this.queue(packet);
    }

    public logout(): void {
        this.packetQueue = [];
        this.updatingQueue = [];

        this.socket.write(new Packet(181).toBuffer(this.player.outCipher));
    }

    public chatboxMessage(message: string): void {
        const packet = new Packet(82, PacketType.DYNAMIC_SMALL);
        packet.putString(message);

        this.queue(packet);
    }

    public consoleMessage(message: string): void {
        const packet = new Packet(83, PacketType.DYNAMIC_SMALL);
        packet.putString(message);

        this.queue(packet);
    }

    public sendConsoleCommand(command: string, help: string): void {
        const packet = new Packet(85, PacketType.DYNAMIC_SMALL);
        packet.putString(command);
        packet.putString(help);
        this.queue(packet);
    }

    public updateSkill(skillId: number, level: number, exp: number): void {
        const packet = new Packet(34);
        packet.put(level);
        packet.put(skillId);
        packet.put(exp, 'INT', 'LITTLE_ENDIAN');

        this.queue(packet);
    }

    public constructMapRegion(mapData: ConstructedRegion): void {
        const packet = new Packet(23, PacketType.DYNAMIC_LARGE);

        packet.put(this.player.position.chunkLocalY, 'short');
        packet.put(this.player.position.chunkLocalX, 'short', 'le');
        packet.put(this.player.position.chunkX + 6, 'short');
        packet.put(this.player.position.level);
        packet.put(this.player.position.chunkY + 6, 'short');

        packet.openBitBuffer();

        const mapWorldX = mapData.renderPosition.x;
        const mapWorldY = mapData.renderPosition.y;

        const topCornerMapChunk = world.chunkManager.getChunkForWorldPosition(new Position(mapWorldX, mapWorldY, this.player.position.level));
        const playerChunk = world.chunkManager.getChunkForWorldPosition(this.player.position);

        const offsetX = playerChunk.position.x - (topCornerMapChunk.position.x - 2);
        const offsetY = playerChunk.position.y - (topCornerMapChunk.position.y - 2);

        mapData.drawOffsetX = offsetX - 6; // 6 === center
        mapData.drawOffsetY = offsetY - 6; // 6 === center

        for(let level = 0; level < 4; level++) {
            for(let x = 0; x < 13; x++) {
                for(let y = 0; y < 13; y++) {
                    let mapTileOffsetX = x + mapData.drawOffsetX;
                    let mapTileOffsetY = y + mapData.drawOffsetY;
                    if(mapTileOffsetX < 0) {
                        mapTileOffsetX = 0;
                    }
                    if(mapTileOffsetX > 12) {
                        mapTileOffsetX = 12;
                    }
                    if(mapTileOffsetY < 0) {
                        mapTileOffsetY = 0;
                    }
                    if(mapTileOffsetY > 12) {
                        mapTileOffsetY = 12;
                    }

                    const constructedChunk: ConstructedChunk | null = mapData.chunks[level][mapTileOffsetX][mapTileOffsetY];
                    packet.putBits(1, constructedChunk === null ? 0 : 1)
                    if (constructedChunk !== null) {
                        const { templatePosition, rotation } = constructedChunk;
                        packet.putBits(2, templatePosition?.level & 0x3);
                        packet.putBits(10, templatePosition?.x / 8);
                        packet.putBits(11, templatePosition?.y / 8);
                        packet.putBits(2, rotation || 0);
                        packet.putBits(1, 0); // unused
                    }
                }
            }
        }

        packet.closeBitBuffer();

        // Put the xtea keys for the two construction room template maps
        // Map coords: 29,79 && 30,79
        for(let mapX = 29; mapX <= 30; mapX++) {
            const xteaRegion = xteaRegions[`l${mapX}_79`];
            for(let seeds = 0; seeds < 4; seeds++) {
                packet.put(xteaRegion?.key[seeds] || 0, 'int');
            }
        }

        this.queue(packet);
    }

    public updateCurrentMapChunk(): void {
        const packet = new Packet(166, PacketType.DYNAMIC_LARGE);
        packet.put(this.player.position.chunkLocalY, 'short');
        packet.put(this.player.position.chunkX + 6, 'short', 'le');
        packet.put(this.player.position.chunkLocalX, 'short');
        packet.put(this.player.position.chunkY + 6, 'short', 'le');
        packet.put(this.player.position.level);

        const startX = Math.floor(this.player.position.chunkX / 8);
        const endX = Math.floor((this.player.position.chunkX + 12) / 8);
        const startY = Math.floor(this.player.position.chunkY / 8);
        const endY = Math.floor((this.player.position.chunkY + 12) / 8);

        for(let mapX = startX; mapX <= endX; mapX++) {
            for(let mapY = startY; mapY <= endY; mapY++) {
                const xteaRegion = xteaRegions[`l${mapX}_${mapY}`];
                for(let seeds = 0; seeds < 4; seeds++) {
                    packet.put(xteaRegion?.key[seeds] || 0, 'int');
                }
            }
        }

        this.queue(packet);
    }

    public updatePlayerOption(option: string, index: number = 0, placement: 'TOP' | 'BOTTOM' = 'BOTTOM'): void {
        const packet = new Packet(223, PacketType.DYNAMIC_SMALL);
        packet.putString(!option ? 'hidden' : option);
        packet.put(placement === 'TOP' ? 1 : 0);
        packet.put(index + 1);

        this.queue(packet);
    }

    public flushQueue(): void {
        if(!this.socket || this.socket.destroyed) {
            return;
        }

        const buffer = Buffer.concat([...this.packetQueue, ...this.updatingQueue]);
        if(buffer.length !== 0) {
            this.socket.write(buffer);
        }

        this.updatingQueue = [];
        this.packetQueue = [];
    }

    public queue(packet: Packet, updateTask: boolean = false): void {
        if(!this.socket || this.socket.destroyed) {
            return;
        }

        const queue = updateTask ? this.updatingQueue : this.packetQueue;

        const packetBuffer = packet.toBuffer(this.player.outCipher);
        queue.push(packetBuffer);
    }

    private putCameraPosition(packet: Packet, position: Position, height: number, speed: number, acceleration: number): void {
        packet.put(position.calculateChunkLocalX(this.player.lastMapRegionUpdatePosition));
        packet.put(position.calculateChunkLocalY(this.player.lastMapRegionUpdatePosition));
        packet.put(height, 'SHORT');
        packet.put(speed);
        packet.put(acceleration);
    }

    private getChunkPositionOffset(x: number, y: number, chunk: Chunk): number {
        const offsetX = x - ((chunk.position.x + 6) * 8);
        const offsetY = y - ((chunk.position.y + 6) * 8);
        return (offsetX * 16 + offsetY);
    }

    private getChunkOffset(chunk: Chunk): { offsetX: number, offsetY: number } {
        let offsetX = (chunk.position.x + 6) * 8;
        let offsetY = (chunk.position.y + 6) * 8;
        offsetX -= (this.player.lastMapRegionUpdatePosition.chunkX * 8);
        offsetY -= (this.player.lastMapRegionUpdatePosition.chunkY * 8);

        return { offsetX, offsetY };
    }

    private strip(packet: Packet): Buffer {
        const size = packet.writerIndex;
        const buffer = new ByteBuffer(size);
        packet.copy(buffer, 0, 0, size);
        return Buffer.from(buffer);
    }

    private segment(container: ItemContainer, start: number): { bitset: number, buffer: Buffer } {
        const bound = 7 * 8;
        const payload = new Packet(-1, PacketType.FIXED, bound);

        let bitset: number = 0;

        for (let offset = 0; offset < 8; offset++) {
            const item = container.items[start + offset];

            if (!item) {
                continue;
            }

            bitset |= 1 << offset;

            const large = item.amount >= 255;

            if (large) {
                payload.put(255, 'BYTE');
            }

            payload.put(item.amount, large ? 'INT' : 'BYTE');
            payload.put(item.itemId + 1, 'SHORT');
        }

        return { bitset, buffer: this.strip(payload) };
    }

}
