import { Player } from '../player';
import { RsBuffer, stringToLong } from '../../../../../net/rs-buffer';
import { Task } from '../../../../../task/task';
import { UpdateFlags } from '../update-flags';
import { Packet, PacketType } from '../../../../../net/packet';

/**
 * Handles the chonky player updating packet.
 */
export class PlayerUpdateTask extends Task<void> {

    private readonly player: Player;

    public constructor(player: Player) {
        super();
        this.player = player;
    }

    public execute(): Promise<void> {
        return new Promise<void>(resolve => {
            const updateFlags: UpdateFlags = this.player.updateFlags;
            const playerUpdatePacket: Packet = new Packet(90, PacketType.DYNAMIC_LARGE, 16);
            playerUpdatePacket.openBitChannel();

            const updateMaskData = RsBuffer.create();

            if(updateFlags.mapRegionUpdateRequired) {
                playerUpdatePacket.writeBits(1, 1); // Update Required
                playerUpdatePacket.writeBits(2, 3); // Player Teleported
                playerUpdatePacket.writeBits(1, 0); // Whether or not the client should discard the current walking queue (1 if teleporting, 0 if not)
                playerUpdatePacket.writeBits(2, 0); // Player Height
                playerUpdatePacket.writeBits(7, this.player.position.chunkLocalY); // Player Local Chunk Y
                playerUpdatePacket.writeBits(7, this.player.position.chunkLocalX); // Player Local Chunk X
                playerUpdatePacket.writeBits(1, updateFlags.updateBlockRequired ? 1 : 0); // Whether or not an update block follows
            } else {
                this.appendPlayerMovement(this.player, playerUpdatePacket);
            }

            this.appendUpdateMaskData(this.player, updateMaskData);
            playerUpdatePacket.writeBits(8, 0); // Player Count

            if(updateMaskData.getWriterIndex() !== 0) {
                playerUpdatePacket.writeBits(11, 2047);
                playerUpdatePacket.closeBitChannel();

                playerUpdatePacket.writeBytes(updateMaskData);
            } else {
                // No player updates were appended, so just end the packet here
                playerUpdatePacket.closeBitChannel();
            }

            this.player.packetSender.send(playerUpdatePacket);
            resolve();
        });
    }

    private appendUpdateMaskData(player: Player, updateMaskData: RsBuffer, forceUpdate?: boolean): void {
        const updateFlags = player.updateFlags;

        if(!updateFlags.updateBlockRequired && !forceUpdate) {
            return;
        }

        let mask: number = 0;

        if(updateFlags.appearanceUpdateRequired) {
            mask |= 0x4;
        }

        if(mask >= 0xff) {
            mask |= 0x20;
            updateMaskData.writeByte(mask & 0xff);
            updateMaskData.writeByte(mask >> 8);
        } else {
            updateMaskData.writeByte(mask);
        }

        if(updateFlags.appearanceUpdateRequired || forceUpdate) {
            const appearanceData: RsBuffer = RsBuffer.create();
            appearanceData.writeByte(0); // Gender
            appearanceData.writeByte(-1); // Skull Icon
            appearanceData.writeByte(-1); // Prayer Icon

            for(let i = 0; i < 4; i++) {
                appearanceData.writeByte(0); // Equipment
            }

            appearanceData.writeShortBE(0x100 + 10); // Chest
            appearanceData.writeByte(0); // Shield
            appearanceData.writeShortBE(0x100 + 26); // Arms
            appearanceData.writeShortBE(0x100 + 36); // Legs
            appearanceData.writeShortBE(0x100 + 0); // Head
            appearanceData.writeShortBE(0x100 + 33); // Gloves
            appearanceData.writeShortBE(0x100 + 42); // Boots
            appearanceData.writeShortBE(0x100 + 18); // Facial Hair

            appearanceData.writeByte(0); // Hair Color
            appearanceData.writeByte(0); // Torso Color
            appearanceData.writeByte(0); // Leg Color
            appearanceData.writeByte(0); // Feet Color
            appearanceData.writeByte(0); // Skin Color

            appearanceData.writeShortBE(0x328); // Stand Anim
            appearanceData.writeShortBE(0x337); // Stand Turn Anim
            appearanceData.writeShortBE(0x333); // Walk Anim
            appearanceData.writeShortBE(0x334); // Turn 180 Anim
            appearanceData.writeShortBE(0x335); // Turn 90 Anim
            appearanceData.writeShortBE(0x336); // Turn 90 Counter-Clockwise Anim
            appearanceData.writeShortBE(0x338); // Run Anim

            appearanceData.writeLongBE(stringToLong(player.username)); // Username
            appearanceData.writeByte(3); // Combat Level
            appearanceData.writeShortBE(0); // Skill Level (Total Level)

            const appearanceDataSize = appearanceData.getWriterIndex();

            updateMaskData.writeByte(appearanceDataSize);
            updateMaskData.writeBytes(appearanceData.getData().reverse());
        }
    }

    private appendPlayerMovement(player: Player, packet: RsBuffer): void {
        if(player.walkDirection !== -1) {
            // Player is walking/running
            packet.writeBits(1, 1);

            if(player.runDirection === -1) {
                // Player is walking
                packet.writeBits(2, 1);
                packet.writeBits(3, player.walkDirection);
            } else {
                // Player is running
                packet.writeBits(2, 2);
                packet.writeBits(3, player.walkDirection);
                packet.writeBits(3, player.runDirection);
            }
        } else {
            // Did not move
            if(player.updateFlags.updateBlockRequired) {
                packet.writeBits(1, 1); // Player did not move, but an update is still required
                packet.writeBits(2, 0); // Signify the player did not move
            } else {
                packet.writeBits(1, 0); // Nothing needs updating
            }
        }
    }

}
