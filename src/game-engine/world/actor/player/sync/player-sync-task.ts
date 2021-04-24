import { ByteBuffer } from '@runejs/core/buffer';

import { UpdateFlags } from '@engine/world/actor/update-flags';
import { Packet, PacketType } from '@engine/net/packet';
import { world } from '@engine/game-server';
import { stringToLong } from '@engine/util/strings';
import { findItem, findNpc } from '@engine/config';
import { EquipmentSlot, ItemDetails } from '@engine/config/item-config';
import { appendMovement, registerNewActors, SyncTask, syncTrackedActors } from './actor-sync';
import { Player } from '../player';


/**
 * Handles the chonky player synchronization packet.
 */
export class PlayerSyncTask extends SyncTask<void> {

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
            }).filter(collision => collision?.actor && collision.actor.instance === this.player.instance);

            if(nearbyPlayers.length > 200) {
                nearbyPlayers = world.playerTree.colliding({
                    x: this.player.position.x - 7,
                    y: this.player.position.y - 7,
                    width: 16,
                    height: 16
                });
            }

            this.player.trackedPlayers = syncTrackedActors(playerUpdatePacket, this.player.position,
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

            if(player.savedMetadata.npcTransformation) {
                appearanceData.put(65535, 'SHORT');
                appearanceData.put(player.savedMetadata.npcTransformation, 'SHORT');
            } else {
                for(let i = 0; i < 4; i++) {
                    const item = equipment.items[i];

                    if(item) {
                        appearanceData.put(0x200 + item.itemId, 'SHORT');
                    } else {
                        appearanceData.put(0);
                    }
                }

                const torsoItem = player.getEquippedItem('torso');
                let torsoItemData: ItemDetails = null;
                if(torsoItem) {
                    torsoItemData = findItem(torsoItem.itemId);
                    appearanceData.put(0x200 + torsoItem.itemId, 'SHORT');
                } else {
                    appearanceData.put(0x100 + player.appearance.torso, 'SHORT');
                }

                const offHandItem = player.getEquippedItem('off_hand');
                if(offHandItem) {
                    appearanceData.put(0x200 + offHandItem.itemId, 'SHORT');
                } else {
                    appearanceData.put(0);
                }

                if(torsoItemData && torsoItemData.equipmentData && torsoItemData.equipmentData.equipmentType &&
                    torsoItemData.equipmentData.equipmentType === 'full_top') {
                    appearanceData.put(0);
                } else {
                    appearanceData.put(0x100 + player.appearance.arms, 'SHORT');
                }

                this.appendBasicAppearanceItem(appearanceData, player, player.appearance.legs, 'legs');

                const headItem = player.getEquippedItem('head');
                let helmetType = null;
                let fullHelmet = false;

                if(headItem) {
                    const headItemData = findItem(headItem.itemId);

                    if(headItemData && headItemData.equipmentData && headItemData.equipmentData.equipmentType) {
                        helmetType = headItemData.equipmentData.equipmentType;

                        if(helmetType === 'helmet') {
                            fullHelmet = true;
                        }
                    }
                }

                if(!headItem || helmetType === 'hat') {
                    appearanceData.put(0x100 + player.appearance.head, 'SHORT');
                } else {
                    appearanceData.put(0);
                }

                this.appendBasicAppearanceItem(appearanceData, player, player.appearance.hands, 'hands');
                this.appendBasicAppearanceItem(appearanceData, player, player.appearance.feet, 'feet');

                if(player.appearance.gender === 1 || fullHelmet) {
                    appearanceData.put(0);
                } else {
                    appearanceData.put(0x100 + player.appearance.facialHair, 'SHORT');
                }
            }

            [
                player.appearance.hairColor,
                player.appearance.torsoColor,
                player.appearance.legColor,
                player.appearance.feetColor,
                player.appearance.skinColor,
            ].forEach(color => appearanceData.put(color));

            let animations = [
                0x328, // stand
                0x337, // stand turn
                0x333, // walk
                0x334, // turn 180
                0x335, // turn 90
                0x336, // turn 90 reverse
                0x338, // run
            ];

            if(player.savedMetadata.npcTransformation) {
                const npc = findNpc(player.savedMetadata.npcTransformation);
                animations = [
                    npc?.animations?.stand || 0x328, // stand
                    npc?.animations?.turnAround || 0x337, // stand turn
                    npc?.animations?.walk || 0x333, // walk
                    npc?.animations?.turnAround || 0x334, // turn 180
                    npc?.animations?.turnRight || 0x335, // turn 90
                    npc?.animations?.turnLeft || 0x336, // turn 90 reverse
                    npc?.animations?.walk || 0x338, // run
                ];
            }

            animations.forEach(animationId => appearanceData.put(animationId, 'SHORT'));

            appearanceData.put(stringToLong(player.username), 'LONG'); // Username
            appearanceData.put(player.skills.getCombatLevel()); // Combat Level
            appearanceData.put(player.skills.getTotalLevel(), 'SHORT'); // Skill Level (Total Level)

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

    private appendBasicAppearanceItem(buffer: ByteBuffer, player: Player, appearanceInfo: number, equipmentSlot: EquipmentSlot): void {
        const item = player.getEquippedItem(equipmentSlot);
        if(item) {
            buffer.put(0x200 + item.itemId, 'SHORT');
        } else {
            buffer.put(0x100 + appearanceInfo, 'SHORT');
        }
    }

}
