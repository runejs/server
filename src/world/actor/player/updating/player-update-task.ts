import { Player } from '../player';
import { Task } from '@server/task/task';
import { UpdateFlags } from '@server/world/actor/update-flags';
import { Packet, PacketType } from '@server/net/packet';
import { world } from '@server/game-server';
import { EquipmentSlot, HelmetType, ItemDetails, TorsoType } from '@server/world/config/item-data';
import { ItemContainer } from '@server/world/items/item-container';
import { appendMovement, updateTrackedActors, registerNewActors } from './actor-updating';
import { ByteBuffer } from '@runejs/byte-buffer';
import { stringToLong } from '@server/util/strings';

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
            playerUpdatePacket.openBitBuffer();

            const updateMaskData = new ByteBuffer(5000);

            if(updateFlags.mapRegionUpdateRequired || this.player.metadata['teleporting']) {
                playerUpdatePacket.putBits(1, 1); // Update Required
                playerUpdatePacket.putBits(2, 3); // Map Region changed
                playerUpdatePacket.putBits(1, this.player.metadata['teleporting'] ? 1 : 0); // Whether or not the client should discard the current walking queue (1 if teleporting, 0 if not)
                playerUpdatePacket.putBits(2, this.player.position.level); // Player Height
                playerUpdatePacket.putBits(1, updateFlags.updateBlockRequired ? 1 : 0); // Whether or not an update flag block follows
                playerUpdatePacket.putBits(7, this.player.position.chunkLocalX); // Player Local Chunk X
                playerUpdatePacket.putBits(7, this.player.position.chunkLocalY); // Player Local Chunk Y
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

            this.player.trackedPlayers = updateTrackedActors(playerUpdatePacket, this.player.position,
                actor => this.appendUpdateMaskData(actor as Player, updateMaskData), this.player.trackedPlayers, nearbyPlayers) as Player[];

            registerNewActors(playerUpdatePacket, this.player, this.player.trackedPlayers, nearbyPlayers, actor => {
                const newPlayer = actor as Player;
                const positionOffsetX = newPlayer.position.x - this.player.position.x;
                const positionOffsetY = newPlayer.position.y - this.player.position.y;

                // Add other player to this player's list of tracked players
                this.player.trackedPlayers.push(newPlayer);

                // Notify the client of the new player and their worldIndex
                playerUpdatePacket.putBits(11, newPlayer.worldIndex + 1);

                playerUpdatePacket.putBits(5, positionOffsetX); // World Position X axis offset relative to the main player
                playerUpdatePacket.putBits(5, positionOffsetY); // World Position Y axis offset relative to the main player
                playerUpdatePacket.putBits(3, newPlayer.faceDirection);
                playerUpdatePacket.putBits(1, 1); // Update is required
                playerUpdatePacket.putBits(1, 1); // Discard client walking queues

                this.appendUpdateMaskData(newPlayer, updateMaskData, true);
            });

            if(updateMaskData.writerIndex !== 0) {
                playerUpdatePacket.putBits(11, 2047);
                playerUpdatePacket.closeBitBuffer();

                playerUpdatePacket.putBytes(updateMaskData.flipWriter());
            } else {
                // No player updates were appended, so just end the packet here
                playerUpdatePacket.closeBitBuffer();
            }

            this.player.outgoingPackets.queue(playerUpdatePacket, true);
            resolve();
        });
    }

    private appendUpdateMaskData(player: Player, updateMaskData: ByteBuffer, forceUpdate?: boolean): void {
        const updateFlags = player.updateFlags;

        if(!updateFlags.updateBlockRequired && !forceUpdate) {
            return;
        }

        let mask: number = 0;

        if(updateFlags.damage !== null) {
            mask |= 0x100;
        }
        if(updateFlags.appearanceUpdateRequired || forceUpdate) {
            mask |= 0x20;
        }
        if(updateFlags.chatMessages.length !== 0) {
            mask |= 0x8;
        }
        if(updateFlags.faceActor !== undefined) {
            mask |= 0x4;
        }
        if(updateFlags.facePosition) {
            mask |= 0x10;
        }
        if(updateFlags.graphics) {
            mask |= 0x200;
        }
        if(updateFlags.animation !== undefined) {
            mask |= 0x1;
        }

        if(mask >= 0x100) {
            mask |= 0x2;
            updateMaskData.put(mask & 0xff);
            updateMaskData.put(mask >> 8);
        } else {
            updateMaskData.put(mask);
        }

        if(updateFlags.damage !== null) {
            const damage = updateFlags.damage;
            updateMaskData.put(damage.damageType);
            updateMaskData.put(damage.damageType.valueOf());
            updateMaskData.put(damage.remainingHitpoints);
            updateMaskData.put(damage.maxHitpoints);
        }

        if(updateFlags.facePosition) {
            const position = updateFlags.facePosition;
            updateMaskData.put(position.x * 2 + 1, 'SHORT');
            updateMaskData.put(position.y * 2 + 1, 'SHORT', 'LITTLE_ENDIAN');
        }

        if(updateFlags.animation !== undefined) {
            const animation = updateFlags.animation;

            if(animation === null || animation.id === -1) {
                // Reset animation
                updateMaskData.put(-1, 'SHORT', 'LITTLE_ENDIAN');
                updateMaskData.put(0, 'BYTE');
            } else {
                const delay = updateFlags.animation.delay || 0;
                updateMaskData.put(updateFlags.animation.id, 'SHORT', 'LITTLE_ENDIAN');
                updateMaskData.put(delay, 'BYTE');
            }
        }

        if(updateFlags.faceActor !== undefined) {
            const actor = updateFlags.faceActor;

            if(actor === null) {
                // Reset faced actor
                updateMaskData.put(65535, 'SHORT');
            } else {
                let worldIndex = actor.worldIndex;

                if(actor instanceof Player) {
                    // Client checks if index is less than 32768.
                    // If it is, it looks for an NPC.
                    // If it isn't, it looks for a player (subtracting 32768 to find the index).
                    worldIndex += 32768 + 1;
                }

                updateMaskData.put(worldIndex, 'SHORT');
            }
        }

        if(updateFlags.chatMessages.length !== 0) {
            const message = updateFlags.chatMessages[0];
            updateMaskData.put(((message.color & 0xFF) << 8) + (message.effects & 0xFF), 'SHORT');
            updateMaskData.put(player.rights.valueOf(), 'BYTE');
            updateMaskData.put(message.data.length, 'BYTE');
            for(let i = 0; i < message.data.length; i++) {
                updateMaskData.put(message.data.readInt8(i), 'BYTE');
            }
        }

        if(updateFlags.appearanceUpdateRequired || forceUpdate) {
            const equipment = player.equipment;
            const appearanceData = new ByteBuffer(500);
            appearanceData.put(player.appearance.gender); // Gender
            appearanceData.put(-1); // Skull Icon
            appearanceData.put(-1); // Prayer Icon

            for(let i = 0; i < 4; i++) {
                const item = equipment.items[i];

                if(item) {
                    appearanceData.put(0x200 + item.itemId, 'SHORT');
                } else {
                    appearanceData.put(0);
                }
            }

            const torsoItem = equipment.items[EquipmentSlot.TORSO];
            let torsoItemData: ItemDetails = null;
            if(torsoItem) {
                torsoItemData = world.itemData.get(torsoItem.itemId);
                appearanceData.put(0x200 + torsoItem.itemId, 'SHORT');
            } else {
                appearanceData.put(0x100 + player.appearance.torso, 'SHORT');
            }

            const offHandItem = equipment.items[EquipmentSlot.OFF_HAND];
            if(offHandItem) {
                appearanceData.put(0x200 + offHandItem.itemId, 'SHORT');
            } else {
                appearanceData.put(0);
            }

            if(torsoItemData && torsoItemData.equipment && torsoItemData.equipment.torsoType && torsoItemData.equipment.torsoType === TorsoType.FULL) {
                appearanceData.put(0);
            } else {
                appearanceData.put(0x100 + player.appearance.arms, 'SHORT');
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
                appearanceData.put(0x100 + player.appearance.head, 'SHORT');
            } else {
                appearanceData.put(0);
            }

            this.appendBasicAppearanceItem(appearanceData, equipment, player.appearance.hands, EquipmentSlot.GLOVES);
            this.appendBasicAppearanceItem(appearanceData, equipment, player.appearance.feet, EquipmentSlot.BOOTS);

            if(player.appearance.gender === 1 || fullHelmet) {
                appearanceData.put(0);
            } else {
                appearanceData.put(0x100 + player.appearance.facialHair, 'SHORT');
            }

            [
                player.appearance.hairColor,
                player.appearance.torsoColor,
                player.appearance.legColor,
                player.appearance.feetColor,
                player.appearance.skinColor,
            ].forEach(color => appearanceData.put(color));

            [
                0x328, // stand
                0x337, // stand turn
                0x333, // walk
                0x334, // turn 180
                0x335, // turn 90
                0x336, // turn 90 reverse
                0x338, // run
            ].forEach(animationId => appearanceData.put(animationId, 'SHORT'));

            appearanceData.put(stringToLong(player.username), 'LONG'); // Username
            appearanceData.put(3); // Combat Level
            appearanceData.put(0, 'SHORT'); // Skill Level (Total Level)

            const appearanceDataSize = appearanceData.writerIndex;

            updateMaskData.put(appearanceDataSize);
            updateMaskData.putBytes(appearanceData.flipWriter());
        }

        if(updateFlags.graphics) {
            const delay = updateFlags.graphics.delay || 0;
            updateMaskData.put(updateFlags.graphics.id, 'SHORT', 'LITTLE_ENDIAN');
            updateMaskData.put(updateFlags.graphics.height << 16 | delay & 0xffff, 'INT');
        }
    }

    private appendBasicAppearanceItem(buffer: ByteBuffer, equipment: ItemContainer, appearanceInfo: number, equipmentSlot: EquipmentSlot): void {
        const item = equipment.items[equipmentSlot];
        if(item) {
            buffer.put(0x200 + item.itemId, 'SHORT');
        } else {
            buffer.put(0x100 + appearanceInfo, 'SHORT');
        }
    }

}
