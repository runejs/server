import { Player } from '../player';
import { RsBuffer, stringToLong } from '@server/net/rs-buffer';
import { Task } from '@server/task/task';
import { UpdateFlags } from '@server/world/mob/update-flags';
import { Packet, PacketType } from '@server/net/packet';
import { world } from '@server/game-server';
import { EquipmentSlot, HelmetType, ItemDetails, TorsoType } from '@server/world/config/item-data';
import { ItemContainer } from '@server/world/items/item-container';
import { appendMovement, updateTrackedMobs, registerNewMobs } from './mob-updating';

/**
 * Handles the chonky player updating packet.
 */
export class PlayerUpdateTask extends Task<void> {

    private readonly player: Player;

    public constructor(player: Player) {
        super();
        this.player = player;
    }

    public async execute(): Promise<void> {
        return new Promise<void>(resolve => {
            const updateFlags: UpdateFlags = this.player.updateFlags;
            const playerUpdatePacket: Packet = new Packet(92, PacketType.DYNAMIC_LARGE);
            playerUpdatePacket.openBitChannel();

            const updateMaskData = RsBuffer.create();

            if(updateFlags.mapRegionUpdateRequired || this.player.metadata['teleporting']) {
                playerUpdatePacket.writeBits(1, 1); // Update Required
                playerUpdatePacket.writeBits(2, 3); // Map Region changed
                playerUpdatePacket.writeBits(1, this.player.metadata['teleporting'] ? 1 : 0); // Whether or not the client should discard the current walking queue (1 if teleporting, 0 if not)
                playerUpdatePacket.writeBits(2, this.player.position.level); // Player Height
                playerUpdatePacket.writeBits(1, updateFlags.updateBlockRequired ? 1 : 0); // Whether or not an update flag block follows
                playerUpdatePacket.writeBits(7, this.player.position.chunkLocalX); // Player Local Chunk X
                playerUpdatePacket.writeBits(7, this.player.position.chunkLocalY); // Player Local Chunk Y
            } else {
                appendMovement(this.player, playerUpdatePacket);
            }

            this.appendUpdateMaskData(this.player, updateMaskData, false);

            let nearbyPlayers = world.playerTree.colliding({
                x: this.player.position.x - 15,
                y: this.player.position.y - 15,
                width: 32,
                height: 32
            });

            if(nearbyPlayers.length > 200) {
                nearbyPlayers = world.playerTree.colliding({
                    x: this.player.position.x - 7,
                    y: this.player.position.y - 7,
                    width: 16,
                    height: 16
                });
            }

            this.player.trackedPlayers = updateTrackedMobs(playerUpdatePacket, this.player.position,
                mob => this.appendUpdateMaskData(mob as Player, updateMaskData), this.player.trackedPlayers, nearbyPlayers) as Player[];

            registerNewMobs(playerUpdatePacket, this.player, this.player.trackedPlayers, nearbyPlayers, mob => {
                const newPlayer = mob as Player;
                const positionOffsetX = newPlayer.position.x - this.player.position.x;
                const positionOffsetY = newPlayer.position.y - this.player.position.y;

                // Add other player to this player's list of tracked players
                this.player.trackedPlayers.push(newPlayer);

                // Notify the client of the new player and their worldIndex
                playerUpdatePacket.writeBits(11, newPlayer.worldIndex + 1);

                playerUpdatePacket.writeBits(5, positionOffsetY); // World Position Y axis offset relative to the main player
                playerUpdatePacket.writeBits(5, positionOffsetX); // World Position X axis offset relative to the main player
                playerUpdatePacket.writeBits(3, 0); // @TODO default face direction
                playerUpdatePacket.writeBits(1, 1); // Update is required
                playerUpdatePacket.writeBits(1, 1); // Discard client walking queues

                this.appendUpdateMaskData(newPlayer, updateMaskData, true);
            });

            if(updateMaskData.getWriterIndex() !== 0) {
                playerUpdatePacket.writeBits(11, 2047);
                playerUpdatePacket.closeBitChannel();

                playerUpdatePacket.writeBytes(updateMaskData);
            } else {
                // No player updates were appended, so just end the packet here
                playerUpdatePacket.closeBitChannel();
            }

            new Promise(resolve => {
                this.player.packetSender.send(playerUpdatePacket);
                resolve();
            });

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
            mask |= 0x20;
        }
        if(updateFlags.chatMessages.length !== 0) {
            mask |= 0x8;
        }
        /*if(updateFlags.faceMob !== undefined) {
            mask |= 0x1;
        }
        if(updateFlags.facePosition) {
            mask |= 0x2;
        }
        if(updateFlags.graphics) {
            mask |= 0x200;
        }
        if(updateFlags.animation !== undefined) {
            mask |= 0x8;
        }*/

        if(mask >= 0x100) {
            mask |= 0x2;
            updateMaskData.writeByte(mask & 0xff);
            updateMaskData.writeByte(mask >> 8);
        } else {
            updateMaskData.writeByte(mask);
        }

        /*if(updateFlags.animation !== undefined) {
            const animation = updateFlags.animation;

            if(animation === null || animation.id === -1) {
                // Reset animation
                updateMaskData.writeShortBE(-1);
                updateMaskData.writeNegativeOffsetByte(0);
            } else {
                const delay = updateFlags.animation.delay || 0;
                updateMaskData.writeShortBE(updateFlags.animation.id);
                updateMaskData.writeNegativeOffsetByte(delay);
            }
        }*/

        if(updateFlags.chatMessages.length !== 0) {
            const message = updateFlags.chatMessages[0];
            updateMaskData.writeUnsignedShortBE(((message.color & 0xFF) << 8) + (message.effects & 0xFF));
            updateMaskData.writeOffsetByte(player.rights.valueOf());
            updateMaskData.writeByteInverted(message.data.length);
            for(let i = 0; i < message.data.length; i++) {
                updateMaskData.writeOffsetByte(message.data.readInt8(i));
            }
        }

        /*if(updateFlags.faceMob !== undefined) {
            const mob = updateFlags.faceMob;

            if(mob === null) {
                // Reset faced mob
                updateMaskData.writeOffsetShortBE(65535);
            } else {
                let mobIndex = mob.worldIndex;

                if(mob instanceof Player) {
                    // Client checks if index is less than 32768.
                    // If it is, it looks for an NPC.
                    // If it isn't, it looks for a player (subtracting 32768 to find the index).
                    mobIndex += 32768 + 1;
                }

                updateMaskData.writeOffsetShortBE(mobIndex);
            }
        }

        if(updateFlags.facePosition) {
            const position = updateFlags.facePosition;
            updateMaskData.writeShortBE(position.x * 2 + 1);
            updateMaskData.writeShortBE(position.y * 2 + 1);
        }

        if(updateFlags.graphics) {
            const delay = updateFlags.graphics.delay || 0;
            updateMaskData.writeOffsetShortBE(updateFlags.graphics.id);
            updateMaskData.writeIntME1(updateFlags.graphics.height << 16 | delay & 0xffff);
        }*/

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
            updateMaskData.writeBytes(appearanceData.getData());
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

}
