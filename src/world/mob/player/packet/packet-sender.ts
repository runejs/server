import { Player } from '../player';
import { Socket } from 'net';
import { Packet, PacketType } from '@server/net/packet';
import { ItemContainer } from '@server/world/items/item-container';
import { Item } from '@server/world/items/item';
import { Position } from '@server/world/position';
import { LandscapeObject } from '@runejs/cache-parser';
import { Chunk, ChunkUpdateItem } from '@server/world/map/chunk';
import { WorldItem } from '@server/world/items/world-item';
import { rsTime } from '@server/util/time';
import { addressToInt } from '@server/util/address';

/**
 * 6   = set chatbox input type to 2
 * 156 = set minimap state
 * 167 = move camera?
 *
 *
 * 220 = play song
 * 249 = play overlay song?
 * 41  = play sound at position
 *
 * 61  = reset X reference coordinate
 * 75  = update reference position
 * 40  = clear map region ground items and objects
 * 53  = construct map region
 * 222 = send current map region
 * 183 = update map region ground items and objects
 * 88  = remove landscape object
 * 208 = remove ground item
 * 152 = set landscape object
 * 121 = update ground item amount
 * 107 = set ground item
 *
 * 135 = private message received
 * 190 = system update notification
 * 63  = send chatbox message
 *
 * 5   = send logout
 * 199 = show mob hint icon - @TODO COME BACK TO THIS
 * 13  = reset mob animations
 * 90  = player updating
 * 71  = npc updating
 * 157 = add player option
 * 126 = update member status and player index
 *
 * 59  = show graphics at position
 *
 * 29  = close all widgets
 * 10  = show tab widget
 * 76  = show welcome widget
 * 159 = show standalone game widget
 * 50  = show walkable game widget
 * 246 = show standalone sidebar tab widget
 * 128 = show game and sidebar tab widget together (for banking and such)
 * 109 = show standalone chatbox widget
 * 252 = force open sidebar tab
 *
 * 2   = show widget animation
 * 218 = update widget color
 * 232 = send widget string
 * 238 = flash sidebar tab icon
 * 200 = set widget scroll position
 * 166 = set widget position
 * 82  = set widget hidden until hovered state
 *
 * 206 = update widget items
 * 134 = update specific widget items
 * 219 = clear widget items
 * 125 = send player run energy
 * 174 = update carry weight
 * 49  = update player skill
 * 78  = send friend info
 * 251 = update friend list status
 * 226 = update ignore list
 *
 * 186 = set widget model rotation and zoom
 * 21  = show item model on widget
 * 216 = show widget media type 1
 * 162 = show npc head on widget? - @TODO COME BACK TO THIS
 * 255 = show player head on widget
 *
 * 201 = update chat settings
 * 113 = reset widget settings
 * 115 = update large widget setting value
 * 182 = update small widget setting value
 */

/**
 * A helper class for sending various network packets back to the game client.
 */
export class PacketSender {

    private readonly player: Player;
    private readonly socket: Socket;

    public constructor(player: Player) {
        this.player = player;
        this.socket = player.socket;
    }

    public playSong(songId: number): void {
        const packet = new Packet(217);
        packet.writeShortLE(songId);

        this.send(packet);
    }

    public playQuickSong(songId: number, previousSongId: number): void {
        const packet = new Packet(249);
        packet.writeShortLE(songId);
        packet.writeMediumME(previousSongId);

        this.send(packet);
    }

    public playSound(soundId: number, volume: number, delay: number = 0): void {
        const packet = new Packet(131);
        packet.writeShortBE(soundId);
        packet.writeByte(volume);
        packet.writeShortBE(delay);

        this.send(packet);
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

    public updateChunk(chunk: Chunk, chunkUpdates: ChunkUpdateItem[]): void {
        const { offsetX, offsetY } = this.getChunkOffset(chunk);

        const packet = new Packet(63, PacketType.DYNAMIC_LARGE);
        packet.writeByteInverted(offsetX);
        packet.writeNegativeOffsetByte(offsetY);

        chunkUpdates.forEach(update => {
            if(update.type === 'ADD') {
                if(update.object) {
                    const offset = this.getChunkPositionOffset(update.object.x, update.object.y, chunk);
                    packet.writeUnsignedByte(241);
                    packet.writeByteInverted((update.object.type << 2) + (update.object.rotation & 3));
                    packet.writeUnsignedShortBE(update.object.objectId);
                    packet.writeUnsignedOffsetByte(offset);
                } else if(update.worldItem) {
                    const offset = this.getChunkPositionOffset(update.worldItem.position.x, update.worldItem.position.y, chunk);
                    packet.writeUnsignedByte(175);
                    packet.writeUnsignedShortLE(update.worldItem.itemId);
                    packet.writeUnsignedShortBE(update.worldItem.amount);
                    packet.writeUnsignedByte(offset);
                }
            } else if(update.type === 'REMOVE') {
                const offset = this.getChunkPositionOffset(update.object.x, update.object.y, chunk);
                packet.writeUnsignedByte(143);
                packet.writeUnsignedOffsetByte(offset);
                packet.writeByteInverted((update.object.type << 2) + (update.object.rotation & 3));
            }
        });

        this.send(packet);
    }

    public clearChunk(chunk: Chunk): void {
        const { offsetX, offsetY } = this.getChunkOffset(chunk);

        const packet = new Packet(64);
        packet.writeUnsignedByte(offsetY);
        packet.writeUnsignedOffsetByte(offsetX);

        this.send(packet);
    }

    public setWorldItem(worldItem: WorldItem, position: Position, offset: number = 0): void {
        this.updateReferencePosition(position);

        const packet = new Packet(175);
        packet.writeUnsignedShortLE(worldItem.itemId);
        packet.writeUnsignedShortBE(worldItem.amount);
        packet.writeUnsignedByte(offset);

        this.send(packet);
    }

    public removeWorldItem(worldItem: WorldItem, position: Position, offset: number = 0): void {
        this.updateReferencePosition(position);

        const packet = new Packet(74);
        packet.writeUnsignedByte(offset);
        packet.writeUnsignedOffsetShortBE(worldItem.itemId);

        this.send(packet);
    }

    public setLandscapeObject(landscapeObject: LandscapeObject, position: Position, offset: number = 0): void {
        this.updateReferencePosition(position);

        const packet = new Packet(241);
        packet.writeByteInverted((landscapeObject.type << 2) + (landscapeObject.rotation & 3));
        packet.writeUnsignedShortBE(landscapeObject.objectId);
        packet.writeUnsignedOffsetByte(offset);

        this.send(packet);
    }

    public removeLandscapeObject(landscapeObject: LandscapeObject, position: Position, offset: number = 0): void {
        this.updateReferencePosition(position);

        const packet = new Packet(143);
        packet.writeUnsignedOffsetByte(offset);
        packet.writeByteInverted((landscapeObject.type << 2) + (landscapeObject.rotation & 3));

        this.send(packet);
    }

    public updateReferencePosition(position: Position): void {
        const offsetX = position.x - (this.player.lastMapRegionUpdatePosition.chunkX * 8);
        const offsetY = position.y - (this.player.lastMapRegionUpdatePosition.chunkY * 8);

        const packet = new Packet(254);
        packet.writeNegativeOffsetByte(offsetY);
        packet.writeByteInverted(offsetX);

        this.send(packet);
    }

    // Text dialogs = 356, 359, 363, 368, 374
    // Item dialogs = 519
    // Statements (no click to continue) = 210, 211, 212, 213, 214
    public showChatboxWidget(widgetId: number): void {
        const packet = new Packet(208);
        packet.writeUnsignedOffsetShortBE(widgetId);

        this.send(packet);
    }

    public setWidgetNpcHead(widgetId: number, childId: number, modelId: number): void {
        const packet = new Packet(160);
        packet.writeUnsignedShortLE(modelId);
        packet.writeIntLE(widgetId << 16 | childId);

        this.send(packet);
    }

    public setWidgetPlayerHead(widgetId: number, childId: number): void {
        const packet = new Packet(210);
        packet.writeIntLE(widgetId << 16 | childId);

        this.send(packet);
    }

    public playWidgetAnimation(widgetId: number, childId: number, animationId: number): void {
        const packet = new Packet(24);
        packet.writeShortBE(animationId);
        packet.writeIntBE(widgetId << 16 | childId);

        this.send(packet);
    }

    public showScreenAndTabWidgets(widgetId: number, sidebarId: number) : void {
        const packet = new Packet(128);
        packet.writeNegativeOffsetShortBE(widgetId);
        packet.writeNegativeOffsetShortLE(sidebarId);
        this.send(packet);
    }

    public updateClientConfig(configId: number, value: number): void {
        let packet: Packet;

        if(value > 128) {
            packet = new Packet(2);
            packet.writeIntME2(value);
            packet.writeUnsignedShortBE(configId);
        } else {
            packet = new Packet(222);
            packet.writeNegativeOffsetByte(value);
            packet.writeUnsignedOffsetShortBE(configId);
        }

        this.send(packet);
    }

    public updateWidgetSetting(settingId: number, value: number): void {
        let packet: Packet;

        if(value > 255) {
            // @TODO large settings values - packet 115?
        } else {
            packet = new Packet(182);
            packet.writeOffsetShortBE(settingId);
            packet.writeNegativeOffsetByte(value);
        }

        this.send(packet);
    }

    public updateWidgetItemModel(widgetId: number, itemId: number, scale?: number): void {
        const packet = new Packet(21);
        packet.writeShortBE(scale);
        packet.writeShortLE(itemId);
        packet.writeOffsetShortLE(widgetId);

        this.send(packet);
    }

    public updateWidgetString(widgetId: number, childId: number, value: string): void {
        const packet = new Packet(110, PacketType.DYNAMIC_LARGE);
        packet.writeIntLE(widgetId << 16 | childId);
        packet.writeNewString(value);

        this.send(packet);
    }

    public closeActiveWidgets(): void {
        this.send(new Packet(180));
    }

    public showScreenWidget(widgetId: number): void {
        const packet = new Packet(118);
        packet.writeUnsignedShortBE(widgetId);

        this.send(packet);
    }

    // @TODO this can support multiple items/slots !!!
    public sendUpdateSingleWidgetItem(widget: { widgetId: number, containerId: number }, slot: number, item: Item): void {
        const packet = new Packet(214, PacketType.DYNAMIC_LARGE);
        packet.writeIntBE(widget.widgetId << 16 | widget.containerId);
        packet.writeSmart(slot);

        if(!item) {
            packet.writeUnsignedShortBE(0);
        } else {
            packet.writeUnsignedShortBE(item.itemId + 1); // +1 because 0 means an empty slot

            if(item.amount >= 255) {
                packet.writeUnsignedByte(255);
                packet.writeIntBE(item.amount);
            } else {
                packet.writeUnsignedByte(item.amount);
            }
        }

        this.send(packet);
    }

    public sendUpdateAllWidgetItems(widget: { widgetId: number, containerId: number }, container: ItemContainer): void {
        const packet = new Packet(12, PacketType.DYNAMIC_LARGE);
        packet.writeIntBE(widget.widgetId << 16 | widget.containerId);
        packet.writeShortBE(container.size);

        const items = container.items;
        items.forEach(item => {
            if(!item) {
                // Empty slot
                packet.writeUnsignedOffsetByte(0);
                packet.writeOffsetShortBE(0);
            } else {
                if(item.amount >= 255) {
                    packet.writeUnsignedOffsetByte(255);
                    packet.writeIntBE(item.amount);
                } else {
                    packet.writeUnsignedOffsetByte(item.amount);
                }

                packet.writeOffsetShortBE(item.itemId + 1); // +1 because 0 means an empty slot
            }
        });

        this.send(packet);
    }

    public sendUpdateAllWidgetItemsById(widget: { widgetId: number, containerId: number }, itemIds: number[]): void {
        const packet = new Packet(12, PacketType.DYNAMIC_LARGE);
        packet.writeIntBE(widget.widgetId << 16 | widget.containerId);
        packet.writeShortBE(itemIds.length);

        itemIds.forEach(itemId => {
            if(!itemId) {
                // Empty slot
                packet.writeUnsignedOffsetByte(0);
                packet.writeOffsetShortBE(0);
            } else {
                packet.writeUnsignedOffsetByte(1);
                packet.writeOffsetShortBE(itemId + 1); // +1 because 0 means an empty slot
            }
        });

        this.send(packet);
    }

    public toggleWidgetVisibility(widgetId: number, childId: number, hidden: boolean): void {
        const packet = new Packet(115);
        packet.writeUnsignedByte(hidden ? 1 : 0);
        packet.writeIntME2(widgetId << 16 | childId);

        this.send(packet);
    }

    public sendTabWidget(tabIndex: number, widgetId: number): void {
        const packet = new Packet(140);
        packet.writeShortBE(widgetId);
        packet.writeByte(tabIndex);

        this.send(packet);
    }

    public showFullscreenWidget(widgetId: number, secondaryWidgetId: number): void {
        const packet = new Packet(195);
        packet.writeUnsignedOffsetShortBE(secondaryWidgetId);
        packet.writeUnsignedShortBE(widgetId);

        this.send(packet);
    }

    /**
     * Clears the player's current map chunk of all ground items and spawned/modified landscape objects.
     */
    public clearMapChunk(): void {
        const packet = new Packet(64);
        packet.writeUnsignedByte(this.player.position.chunkY + 6); // Map Chunk Y
        packet.writeUnsignedOffsetByte(this.player.position.chunkX + 6); // Map Chunk X

        this.send(packet);
    }

    public updateCarryWeight(weight: number): void {
        const packet = new Packet(171);
        packet.writeShortBE(weight);

        this.send(packet);
    }

    public showHintIcon(iconType: 2 | 3 | 4 | 5 | 6, position: Position, offset: number = 0): void {
        const packet = new Packet(199);
        packet.writeUnsignedByte(iconType);
        packet.writeUnsignedShortBE(position.x);
        packet.writeUnsignedShortBE(position.y);
        packet.writeUnsignedByte(offset);

        this.send(packet);
    }

    public showPlayerHintIcon(player: Player): void {
        const packet = new Packet(199);
        packet.writeUnsignedByte(10);
        packet.writeUnsignedShortBE(player.worldIndex);

        // Packet requires a length of 6, so send some extra junk
        packet.writeByte(0);
        packet.writeByte(0);
        packet.writeByte(0);

        this.send(packet);
    }

    public sendLogout(): void {
        this.send(new Packet(181));
    }

    public chatboxMessage(message: string): void {
        const packet = new Packet(82, PacketType.DYNAMIC_SMALL);
        packet.writeNewString(message);

        this.send(packet);
    }

    public sendSkill(skillId: number, level: number, exp: number): void {
        const packet = new Packet(34);
        packet.writeUnsignedOffsetByte(level);
        packet.writeByte(skillId);
        packet.writeIntME2(exp);

        this.send(packet);
    }

    public updateCurrentMapChunk(): void {
        const packet = new Packet(166, PacketType.DYNAMIC_LARGE);
        packet.writeShortBE(this.player.position.chunkLocalY);
        packet.writeShortLE(this.player.position.chunkX + 6);
        packet.writeOffsetShortBE(this.player.position.chunkLocalX);
        packet.writeOffsetShortLE(this.player.position.chunkY + 6);
        packet.writeByteInverted(this.player.position.level);

        for(let xCalc = Math.floor(this.player.position.chunkX / 8); xCalc <= Math.floor((this.player.position.chunkX + 12) / 8); xCalc++) {
            for(let yCalc = Math.floor(this.player.position.chunkY / 8); yCalc <= Math.floor((this.player.position.chunkY + 12) / 8); yCalc++) {
                for(let seeds = 0; seeds < 4; seeds++){
                    packet.writeIntME1(0);
                }
            }
        }

        this.send(packet);
    }

    public send(packet: Packet): void {
        if(!this.socket || this.socket.destroyed) {
            return;
        }

        this.socket.write(packet.toBuffer(this.player.outCipher));
    }

}
