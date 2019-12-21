import { Player } from '../player';
import { Socket } from 'net';
import { Packet, PacketType } from '../../../../../net/packet';
import { ItemContainer } from '../../items/item-container';

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

    public sendUpdateAllInterfaceItems(interfaceId: number, container: ItemContainer): void {
        const packet = new Packet(206, PacketType.DYNAMIC_LARGE);
        packet.writeShortBE(interfaceId);
        packet.writeShortBE(container.size);

        const items = container.items;
        items.forEach(item => {
            if(item === null) {
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

    public sendChatboxMessage(message: string): void {
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
        packet.writeShortBE(this.player.worldIndex + 1);

        this.send(packet);
    }

    public send(packet: Packet): void {
        this.socket.write(packet.toBuffer(this.player.outCipher));
    }

}
