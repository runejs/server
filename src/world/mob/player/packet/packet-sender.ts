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
        const packet = new Packet(220);
        packet.writeOffsetShortLE(songId);

        this.send(packet);
    }

    public playQuickSong(songId: number, previousSongId: number): void {
        const packet = new Packet(249);
        packet.writeShortLE(songId);
        packet.writeMediumME(previousSongId);

        this.send(packet);
    }

    public playSound(soundId: number, volume: number, delay: number = 0): void {
        const packet = new Packet(26);
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

        const packet = new Packet(183, PacketType.DYNAMIC_LARGE);
        packet.writeUnsignedByte(offsetX);
        packet.writeOffsetByte(offsetY);

        chunkUpdates.forEach(update => {
            if(update.type === 'ADD') {
                if(update.object) {
                    const offset = this.getChunkPositionOffset(update.object.x, update.object.y, chunk);
                    packet.writeUnsignedByte(152);
                    packet.writeByteInverted((update.object.type << 2) + (update.object.rotation & 3));
                    packet.writeOffsetShortLE(update.object.objectId);
                    packet.writeOffsetByte(offset);
                } else if(update.worldItem) {
                    const offset = this.getChunkPositionOffset(update.worldItem.position.x, update.worldItem.position.y, chunk);
                    packet.writeUnsignedByte(107);
                    packet.writeShortBE(update.worldItem.itemId);
                    packet.writeByteInverted(offset);
                    packet.writeNegativeOffsetShortBE(update.worldItem.amount);
                }
            } else if(update.type === 'REMOVE') {
                const offset = this.getChunkPositionOffset(update.object.x, update.object.y, chunk);
                packet.writeUnsignedByte(88);
                packet.writeNegativeOffsetByte(offset);
                packet.writeNegativeOffsetByte((update.object.type << 2) + (update.object.rotation & 3));
            }
        });

        this.send(packet);
    }

    public clearChunk(chunk: Chunk): void {
        const { offsetX, offsetY } = this.getChunkOffset(chunk);

        const packet = new Packet(40);
        packet.writeNegativeOffsetByte(offsetY);
        packet.writeByteInverted(offsetX);

        this.send(packet);
    }

    public setWorldItem(worldItem: WorldItem, position: Position, offset: number = 0): void {
        this.updateReferencePosition(position);

        const packet = new Packet(107);
        packet.writeShortBE(worldItem.itemId);
        packet.writeByteInverted(offset);
        packet.writeNegativeOffsetShortBE(worldItem.amount);

        this.send(packet);
    }

    public removeWorldItem(worldItem: WorldItem, position: Position, offset: number = 0): void {
        this.updateReferencePosition(position);

        const packet = new Packet(208);
        packet.writeNegativeOffsetShortBE(worldItem.itemId);
        packet.writeOffsetByte(offset);

        this.send(packet);
    }

    public setLandscapeObject(landscapeObject: LandscapeObject, position: Position, offset: number = 0): void {
        this.updateReferencePosition(position);

        const packet = new Packet(152);
        packet.writeByteInverted((landscapeObject.type << 2) + (landscapeObject.rotation & 3));
        packet.writeOffsetShortLE(landscapeObject.objectId);
        packet.writeOffsetByte(offset);

        this.send(packet);
    }

    public removeLandscapeObject(landscapeObject: LandscapeObject, position: Position, offset: number = 0): void {
        this.updateReferencePosition(position);

        const packet = new Packet(88);
        packet.writeNegativeOffsetByte(offset);
        packet.writeNegativeOffsetByte((landscapeObject.type << 2) + (landscapeObject.rotation & 3));

        this.send(packet);
    }

    public updateReferencePosition(position: Position): void {
        const offsetX = position.x - (this.player.lastMapRegionUpdatePosition.chunkX * 8);
        const offsetY = position.y - (this.player.lastMapRegionUpdatePosition.chunkY * 8);

        const packet = new Packet(75);
        packet.writeByteInverted(offsetX);
        packet.writeOffsetByte(offsetY);

        this.send(packet);
    }

    public playWidgetAnimation(widgetId: number, animationId: number): void {
        const packet = new Packet(2);
        packet.writeNegativeOffsetShortLE(widgetId);
        packet.writeNegativeOffsetShortBE(animationId);

        this.send(packet);
    }

    // NPC dialogs = 4882, 4887, 4893, 4900
    // Player dialogs = 968, 973, 979, 986
    // Text dialogs = 356, 359, 363, 368, 374
    // Item dialogs = 306, 310, 315, 321
    // Statements (no click to continue) = 12788, 12790, 12793, 12797, 6179
    // Options = 2459, 2469, 2480, 2492
    public showChatboxWidget(widgetId: number): void {
        const packet = new Packet(109);
        packet.writeShortBE(widgetId);

        this.send(packet);
    }

    public showWidgetAndSidebar(widgetId: number, sidebarId: number) : void {
        const packet = new Packet(128);
        packet.writeNegativeOffsetShortBE(widgetId);
        packet.writeNegativeOffsetShortLE(sidebarId);
        this.send(packet);
    }

    public setWidgetModel2(widgetId: number, modelId: number): void {
        const packet = new Packet(162);
        packet.writeNegativeOffsetShortBE(modelId);
        packet.writeShortLE(widgetId);

        this.send(packet);
    }

    public setWidgetPlayerHead(widgetId: number): void {
        const packet = new Packet(255);
        packet.writeNegativeOffsetShortLE(widgetId);

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

    public updateWidgetString(widgetId: number, value: string): void {
        const packet = new Packet(232, PacketType.DYNAMIC_LARGE);
        packet.writeOffsetShortLE(widgetId);
        packet.writeString(value);

        this.send(packet);
    }

    public closeActiveWidgets(): void {
        this.send(new Packet(29));
    }

    public showScreenWidget(widgetId: number): void {
        const packet = new Packet(159);
        packet.writeOffsetShortLE(widgetId);

        this.send(packet);
    }

    public sendUpdateSingleWidgetItem(widgetId: number, slot: number, item: Item): void {
        const packet = new Packet(134, PacketType.DYNAMIC_LARGE);
        packet.writeUnsignedShortBE(widgetId);
        packet.writeSmart(slot);

        if(!item) {
            packet.writeUnsignedShortBE(0);
            packet.writeUnsignedByte(0);
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

    public sendUpdateAllWidgetItems(widgetId: number, container: ItemContainer): void {
        const packet = new Packet(206, PacketType.DYNAMIC_LARGE);
        packet.writeShortBE(widgetId);
        packet.writeShortBE(container.size);

        const items = container.items;
        items.forEach(item => {
            if(!item) {
                // Empty slot
                packet.writeOffsetShortLE(0);
                packet.writeUnsignedByteInverted(-1);
            } else {
                packet.writeOffsetShortLE(item.itemId + 1); // +1 because 0 means an empty slot

                if(item.amount >= 255) {
                    packet.writeUnsignedByteInverted(254);
                    packet.writeIntLE(item.amount);
                } else {
                    packet.writeUnsignedByteInverted(item.amount - 1);
                }
            }
        });

        this.send(packet);
    }

    public sendUpdateAllWidgetItemsById(widgetId: number, itemIds: number[]): void {
        const packet = new Packet(206, PacketType.DYNAMIC_LARGE);
        packet.writeShortBE(widgetId);
        packet.writeShortBE(itemIds.length);

        itemIds.forEach(itemId => {
            if(!itemId) {
                // Empty slot
                packet.writeOffsetShortLE(0);
                packet.writeByteInverted(0);
            } else {
                packet.writeOffsetShortLE(itemId + 1); // +1 because 0 means an empty slot
                packet.writeByteInverted(1);
            }
        });

        this.send(packet);
    }

    public toggleWidgetVisibility(widgetId: number, hidden: boolean): void {
        const packet = new Packet(82);
        packet.writeUnsignedByte(hidden ? 1 : 0);
        packet.writeShortBE(widgetId);

        this.send(packet);
    }

    public sendTabWidget(tabIndex: number, widgetId: number): void {
        const packet = new Packet(10);
        packet.writeNegativeOffsetByte(tabIndex);
        packet.writeOffsetShortBE(widgetId);

        this.send(packet);
    }

    public showFullscreenWidget(widgetId: number, childWidgetId: number): void {
        const packet = new Packet(253);
        packet.writeUnsignedShortLE(childWidgetId);
        packet.writeOffsetShortBE(widgetId);

        this.send(packet);
    }

    public updateWelcomeScreenInfo(childId: number, lastLogin: Date, lastAddress: string): void {
        const currentTime = rsTime(new Date());

        this.updateWidgetString(15270, `\\nYou do not have a Bank PIN.\\nPlease visit a bank if you would like one.`);
        this.updateWidgetString(childId + 2, `Interested in helping RuneJS improve?`);
        this.updateWidgetString(childId + 3, `Send us a Pull Request over on Github!`);
        // @TODO reminder that welcome screen models can be changed :)

        const packet = new Packet(76);
        packet.writeUnsignedShortLE(0); // last password change time
        packet.writeOffsetShortLE(3); // junk
        packet.writeShortBE(4); // junk
        packet.writeShortBE(5); // junk
        packet.writeUnsignedShortLE(currentTime); // long screen display time
        packet.writeOffsetShortBE(0); // unread website message count
        packet.writeUnsignedOffsetShortBE(lastLogin === undefined || lastLogin === null ? currentTime : rsTime(lastLogin)); // last login time
        packet.writeShortBE(42); // membership credit days remaining
        packet.writeIntLE(addressToInt(lastAddress)); // last login IP/address
        packet.writeOffsetShortLE(0); // recovery question set time
        packet.writeOffsetByte(12); // junk

        this.send(packet);
    }

    /**
     * Clears the player's current map chunk of all ground items and spawned/modified landscape objects.
     */
    public clearMapChunk(): void {
        const packet = new Packet(40);
        packet.writeNegativeOffsetByte(this.player.position.chunkY + 6); // Map Chunk Y
        packet.writeByteInverted(this.player.position.chunkX + 6); // Map Chunk X

        this.send(packet);
    }

    public updateCarryWeight(weight: number): void {
        const packet = new Packet(174);
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
        this.send(new Packet(5));
    }

    public chatboxMessage(message: string): void {
        const packet = new Packet(63, PacketType.DYNAMIC_SMALL);
        packet.writeString(message);

        this.send(packet);
    }

    public sendSkill(skillId: number, level: number, exp: number): void {
        const packet = new Packet(49);
        packet.writeByteInverted(skillId);
        packet.writeUnsignedByte(level);
        packet.writeIntBE(exp);

        this.send(packet);
    }

    public updateCurrentMapChunk(): void {
        const packet = new Packet(222);
        packet.writeShortBE(this.player.position.chunkY + 6); // Map Chunk Y
        packet.writeOffsetShortLE(this.player.position.chunkX + 6); // Map Chunk X

        this.send(packet);
    }

    public sendMembershipStatusAndWorldIndex(): void {
        const packet = new Packet(126);
        packet.writeUnsignedByte(1); // @TODO member status
        packet.writeShortLE(this.player.worldIndex + 1);

        this.send(packet);
    }

    public send(packet: Packet): void {
        if(!this.socket || this.socket.destroyed) {
            return;
        }

        this.socket.write(packet.toBuffer(this.player.outCipher));
    }

}
