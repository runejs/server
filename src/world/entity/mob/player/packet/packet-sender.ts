import { Player } from '../player';
import { Socket } from 'net';
import { Packet, PacketType } from '../../../../../net/packet';
import { ItemContainer } from '../../items/item-container';
import { Item } from '../../items/item';
import { Position } from '../../../../position';

/**
 * 6   = set chatbox input type to 2
 * 156 = set minimap state
 * 167 = move camera?
 *
 *
 * 220 = play song
 * 249 = play overlay song?
 *
 * 61  = reset X reference coordinate
 * 75  = update reference position
 * 40  = clear map region ground items and objects
 * 53  = construct map region
 * 222 = send current map region
 * 183 = update map region ground items and objects
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
 * 10  = send tab interface
 * 29  = close all interfaces
 * 76  = show welcome interface
 * 159 = show standalone game interface
 * 50  = show walkable game interface
 * 246 = show standalone sidebar tab interface
 * 128 = show game and sidebar tab interface together (for banking and such)
 * 109 = show standalone chatbox interface
 * 252 = force open sidebar tab
 *
 * 2   = show interface animation
 * 218 = update interface color
 * 232 = send interface string
 * 238 = flash sidebar tab icon
 * 200 = set interface scroll position
 * 166 = set interface position
 * 82  = set interface hidden until hovered state
 *
 * 206 = update interface items
 * 134 = update specific interface items
 * 219 = clear interface items
 * 125 = send player run energy
 * 174 = update carry weight
 * 49  = update player skill
 * 78  = send friend info
 * 226 = update ignore list
 *
 * 186 = set interface model rotation and zoom
 * 21  = show item model on interface
 * 216 = show interface media type 1
 * 162 = show npc head on interface? - @TODO COME BACK TO THIS
 * 255 = show player head on interface
 *
 * 201 = update chat settings
 * 113 = reset interface settings
 * 115 = update large interface setting value
 * 182 = update small interface setting value
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

    public updateCarryWeight(weight: number): void {
        const packet = new Packet(174);
        packet.writeShortBE(weight);

        this.send(packet);
    }

    public updateInterfaceSetting(settingId: number, value: number): void {
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

    public updateInterfaceString(interfaceId: number, value: string): void {
        const packet = new Packet(232, PacketType.DYNAMIC_LARGE);
        packet.writeOffsetShortLE(interfaceId);
        packet.writeString(value);

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

    public sendCloseActiveGameInterface(): void {
        this.send(new Packet(29));
    }

    public sendOpenGameInterface(interfaceId: number): void {
        const packet = new Packet(159);
        packet.writeOffsetShortLE(interfaceId);

        this.send(packet);
    }

    public sendUpdateSingleInterfaceItem(interfaceId: number, slot: number, item: Item): void {
        const packet = new Packet(134, PacketType.DYNAMIC_LARGE);
        packet.writeShortBE(interfaceId);
        packet.writeSmart(slot);

        if(!item) {
            packet.writeShortBE(0);
            packet.writeByte(0);
        } else {
            packet.writeShortBE(item.itemId + 1); // +1 because 0 means an empty slot

            if(item.amount >= 255) {
                packet.writeByte(255);
                packet.writeIntBE(item.amount);
            } else {
                packet.writeByte(item.amount);
            }
        }

        this.send(packet);
    }

    public sendUpdateAllInterfaceItems(interfaceId: number, container: ItemContainer): void {
        const packet = new Packet(206, PacketType.DYNAMIC_LARGE);
        packet.writeShortBE(interfaceId);
        packet.writeShortBE(container.size);

        const items = container.items;
        items.forEach(item => {
            if(!item) {
                // Empty slot
                packet.writeOffsetShortLE(0);
                packet.writeByteInverted(0);
            } else {
                packet.writeOffsetShortLE(item.itemId + 1); // +1 because 0 means an empty slot

                if(item.amount >= 255) {
                    packet.writeByteInverted(255);
                    packet.writeIntBE(item.amount);
                } else {
                    packet.writeByteInverted(item.amount);
                }
            }
        });

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

    public sendTabInterface(tabIndex: number, interfaceId: number): void {
        const packet = new Packet(10);
        packet.writeNegativeOffsetByte(tabIndex);
        packet.writeOffsetShortBE(interfaceId);

        this.send(packet);
    }

    public sendSkill(skillId: number, level: number, exp: number): void {
        const packet = new Packet(49);
        packet.writeByteInverted(skillId);
        packet.writeUnsignedByte(level);
        packet.writeIntBE(exp);

        this.send(packet);
    }

    public sendCurrentMapRegion(): void {
        const packet = new Packet(222);
        packet.writeShortBE(this.player.position.chunkY + 6); // map region y
        packet.writeOffsetShortLE(this.player.position.chunkX + 6); // map region x

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
