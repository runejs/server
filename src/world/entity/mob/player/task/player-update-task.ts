import { Player } from '../player';
import { RsBuffer, stringToLong } from '../../../../../net/rs-buffer';
import { Task } from '../../../../../task/task';
import { UpdateFlags } from '../update-flags';
import { Packet, PacketType } from '../../../../../net/packet';
import { world } from '../../../../../game-server';
import { EquipmentSlot, HelmetType, ItemDetails, TorsoType } from '../../../../config/item-data';
import { ItemContainer } from '../../items/item-container';

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
            if(!this.player.outCipher) {
                resolve();
                return;
            }

            const updateFlags: UpdateFlags = this.player.updateFlags;
            const playerUpdatePacket: Packet = new Packet(90, PacketType.DYNAMIC_LARGE, 16);
            const currentMapChunk = world.chunkManager.getChunkForWorldPosition(this.player.position);
            playerUpdatePacket.openBitChannel();

            const updateMaskData = RsBuffer.create();

            if(updateFlags.mapRegionUpdateRequired) {
                playerUpdatePacket.writeBits(1, 1); // Update Required
                playerUpdatePacket.writeBits(2, 3); // Map Region changed
                playerUpdatePacket.writeBits(1, 0); // Whether or not the client should discard the current walking queue (1 if teleporting, 0 if not)
                playerUpdatePacket.writeBits(2, this.player.position.level); // Player Height
                playerUpdatePacket.writeBits(7, this.player.position.chunkLocalY); // Player Local Chunk Y
                playerUpdatePacket.writeBits(7, this.player.position.chunkLocalX); // Player Local Chunk X
                playerUpdatePacket.writeBits(1, updateFlags.updateBlockRequired ? 1 : 0); // Whether or not an update flag block follows
            } else {
                this.appendPlayerMovement(this.player, playerUpdatePacket);
            }

            this.appendUpdateMaskData(this.player, updateMaskData);
            playerUpdatePacket.writeBits(8, this.player.trackedPlayers.length); // Tracked Player Count

            let nearbyPlayers = world.chunkManager.getSurroundingChunks(currentMapChunk).map(chunk => chunk.players).flat();
            const existingTrackedPlayers: Player[] = [];

            for(let trackedPlayerIndex = 0; trackedPlayerIndex < this.player.trackedPlayers.length; trackedPlayerIndex++) {
                const trackedPlayer = this.player.trackedPlayers[trackedPlayerIndex];

                if(world.playerExists(trackedPlayer) && nearbyPlayers.findIndex(p => p.equals(trackedPlayer)) !== -1
                        && trackedPlayer.position.withinViewDistance(this.player.position)) {
                    this.appendPlayerMovement(trackedPlayer, playerUpdatePacket);
                    this.appendUpdateMaskData(trackedPlayer, updateMaskData, false);
                    existingTrackedPlayers.push(trackedPlayer);
                } else {
                    playerUpdatePacket.writeBits(1, 1);
                    playerUpdatePacket.writeBits(2, 3);
                }
            }

            this.player.trackedPlayers = existingTrackedPlayers;

            // The client can only handle 80 new players at a time, so we limit each update to a max of 80
            // Any remaining players will be automatically picked up by subsequent updates
            let newPlayers = nearbyPlayers.filter(p1 => !this.player.trackedPlayers.find(p2 => p2.equals(p1)));
            if(newPlayers.length > 80) {
                // We also sort the list of players here by how close they are to the current player if there are more than 80, so we can render the nearest first
                newPlayers = newPlayers
                    .sort((a, b) => this.player.position.distanceBetween(a.position) - this.player.position.distanceBetween(b.position))
                    .slice(0, 80);
            }

            newPlayers.forEach((nearbyPlayer, nearbyPlayerIndex) => {
                if(this.player.equals(nearbyPlayer)) {
                    // Other player is actually this player!
                    return;
                }

                if(!world.playerExists(nearbyPlayer)) {
                    // Other player is no longer in the game world
                    return;
                }

                if(this.player.trackedPlayers.findIndex(p => p.equals(nearbyPlayer)) !== -1) {
                    // Other player is already tracked by this player
                    return;
                }

                const positionOffsetX = nearbyPlayer.position.x - this.player.position.x;
                const positionOffsetY = nearbyPlayer.position.y - this.player.position.y;

                if(!nearbyPlayer.position.withinViewDistance(this.player.position)) {
                    // Player is still too far away to be worth rendering
                    // Also - values greater than 15 and less than -15 are too large, or too small, to be sent via 5 bits (max length of 32)
                    return;
                }

                // Only 255 players are able to be rendered at a time, so we cut it off it there are more than that
                if(this.player.trackedPlayers.length >= 255) {
                    return;
                }

                // Add other player to this player's list of tracked players
                this.player.trackedPlayers.push(nearbyPlayer);

                // Notify the client of the new player and their worldIndex
                playerUpdatePacket.writeBits(11, nearbyPlayer.worldIndex + 1);

                playerUpdatePacket.writeBits(5, positionOffsetX); // World Position X axis offset relative to the main player
                playerUpdatePacket.writeBits(1, 1); // Update is required
                playerUpdatePacket.writeBits(1, 1); // Discard client walking queues
                playerUpdatePacket.writeBits(5, positionOffsetY); // World Position Y axis offset relative to the main player

                this.appendUpdateMaskData(nearbyPlayer, updateMaskData, true);
            });

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

        if(updateFlags.appearanceUpdateRequired || forceUpdate) {
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
            const equipment = player.equipment;
            const appearanceData: RsBuffer = RsBuffer.create();
            appearanceData.writeByte(player.appearance.gender); // Gender
            appearanceData.writeByte(-1); // Skull Icon
            appearanceData.writeByte(-1); // Prayer Icon

            for(let i = 0; i < 4; i++) {
                const item = equipment.items[i];

                if(item) {
                    appearanceData.writeShortBE(0x200 + item.itemId);
                } else {
                    appearanceData.writeByte(0);
                }
            }

            const torsoItem = equipment.items[EquipmentSlot.TORSO];
            let torsoItemData: ItemDetails = null;
            if(torsoItem) {
                torsoItemData = world.itemData.get(torsoItem.itemId);
                appearanceData.writeShortBE(0x200 + torsoItem.itemId);
            } else {
                appearanceData.writeShortBE(0x100 + player.appearance.torso);
            }

            const offHandItem = equipment.items[EquipmentSlot.OFF_HAND];
            if(offHandItem) {
                appearanceData.writeShortBE(0x200 + offHandItem.itemId);
            } else {
                appearanceData.writeByte(0);
            }

            if(torsoItemData && torsoItemData.equipment && torsoItemData.equipment.torsoType && torsoItemData.equipment.torsoType === TorsoType.FULL) {
                appearanceData.writeShortBE(0x200 + torsoItem.itemId);
            } else {
                appearanceData.writeShortBE(0x100 + player.appearance.arms);
            }

            this.appendBasicAppearanceItem(appearanceData, equipment, player.appearance.legs, EquipmentSlot.LEGS);

            const headItem = equipment.items[EquipmentSlot.HEAD];
            let helmetType = null;
            let fullHelmet = false;

            if(headItem) {
                const headItemData = world.itemData.get(equipment.items[EquipmentSlot.HEAD].itemId);

                if(headItemData && headItemData.equipment && headItemData.equipment.helmetType) {
                    helmetType = headItemData.equipment.helmetType;

                    if(helmetType === HelmetType.FULL_HELMET) {
                        fullHelmet = true;
                    }
                }
            }

            if(!helmetType || helmetType === HelmetType.HAT) {
                appearanceData.writeShortBE(0x100 + player.appearance.head);
            } else {
                appearanceData.writeByte(0);
            }

            this.appendBasicAppearanceItem(appearanceData, equipment, player.appearance.hands, EquipmentSlot.GLOVES);
            this.appendBasicAppearanceItem(appearanceData, equipment, player.appearance.feet, EquipmentSlot.BOOTS);

            if(player.appearance.gender === 1 || fullHelmet) {
                appearanceData.writeByte(0);
            } else {
                appearanceData.writeShortBE(0x100 + player.appearance.facialHair);
            }

            [
                player.appearance.hairColor,
                player.appearance.torsoColor,
                player.appearance.legColor,
                player.appearance.feetColor,
                player.appearance.skinColor,
            ].forEach(color => appearanceData.writeByte(color));

            [
                0x328, // stand
                0x337, // stand turn
                0x333, // walk
                0x334, // turn 180
                0x335, // turn 90
                0x336, // turn 90 reverse
                0x338, // run
            ].forEach(animationId => appearanceData.writeShortBE(animationId));

            appearanceData.writeLongBE(stringToLong(player.username)); // Username
            appearanceData.writeByte(3); // Combat Level
            appearanceData.writeShortBE(0); // Skill Level (Total Level)

            const appearanceDataSize = appearanceData.getWriterIndex();

            updateMaskData.writeByte(appearanceDataSize);
            updateMaskData.writeBytes(appearanceData.getData().reverse());
        }
    }

    private appendBasicAppearanceItem(buffer: RsBuffer, equipment: ItemContainer, appearanceInfo: number, equipmentSlot: EquipmentSlot): void {
        const item = equipment.items[equipmentSlot];
        if(item) {
            buffer.writeShortBE(0x200 + item.itemId);
        } else {
            buffer.writeShortBE(0x100 + appearanceInfo);
        }
    }

    private appendPlayerMovement(player: Player, packet: RsBuffer): void {
        if(player.walkDirection !== -1) {
            // Player is walking/running
            packet.writeBits(1, 1); // Update required

            if(player.runDirection === -1) {
                // Player is walking
                packet.writeBits(2, 1); // Player walking
                packet.writeBits(3, player.walkDirection);
            } else {
                // Player is running
                packet.writeBits(2, 2); // Player running
                packet.writeBits(3, player.walkDirection);
                packet.writeBits(3, player.runDirection);
            }

            packet.writeBits(1, player.updateFlags.updateBlockRequired ? 1 : 0); // Whether or not an update flag block follows
        } else {
            // Did not move
            if(player.updateFlags.updateBlockRequired) {
                packet.writeBits(1, 1); // Update required
                packet.writeBits(2, 0); // Signify the player did not move
            } else {
                packet.writeBits(1, 0); // No update required
            }
        }
    }

}
