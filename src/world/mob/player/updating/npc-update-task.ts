import { Task } from '@server/task/task';
import { Player } from '../player';
import { Packet, PacketType } from '@server/net/packet';
import { RsBuffer } from '@server/net/rs-buffer';
import { Npc } from '@server/world/mob/npc/npc';
import { world } from '@server/game-server';
import { registerNewMobs, updateTrackedMobs } from './mob-updating';

/**
 * Handles the chonky npc updating packet for a specific player.
 */
export class NpcUpdateTask extends Task<void> {

    private readonly player: Player;

    public constructor(player: Player) {
        super();
        this.player = player;
    }

    public async execute(): Promise<void> {
        return new Promise<void>(resolve => {
            const npcUpdatePacket: Packet = new Packet(71, PacketType.DYNAMIC_LARGE);
            npcUpdatePacket.openBitChannel();

            const currentMapChunk = world.chunkManager.getChunkForWorldPosition(this.player.position);
            const updateMaskData = RsBuffer.create();

            const nearbyNpcs = world.npcTree.colliding({
                x: this.player.position.x - 15,
                y: this.player.position.y - 15,
                width: 32,
                height: 32
            });

            this.player.trackedNpcs = updateTrackedMobs(npcUpdatePacket, this.player.position,
                mob => this.appendUpdateMaskData(mob as Npc, updateMaskData), this.player.trackedNpcs, nearbyNpcs) as Npc[];

            registerNewMobs(npcUpdatePacket, this.player, this.player.trackedNpcs, nearbyNpcs, mob => {
                const newNpc = mob as Npc;
                const positionOffsetX = newNpc.position.x - this.player.position.x;
                const positionOffsetY = newNpc.position.y - this.player.position.y;

                // Add npc to this player's list of tracked npcs
                this.player.trackedNpcs.push(newNpc);

                // Notify the client of the new npc and their worldIndex
                npcUpdatePacket.writeBits(14, newNpc.worldIndex);
                npcUpdatePacket.writeBits(1, newNpc.updateFlags.updateBlockRequired ? 1 : 0); // Update is required
                npcUpdatePacket.writeBits(5, positionOffsetY); // World Position Y axis offset relative to the player
                npcUpdatePacket.writeBits(5, positionOffsetX); // World Position X axis offset relative to the player
                npcUpdatePacket.writeBits(1, 1); // Discard client walking queues
                npcUpdatePacket.writeBits(13, newNpc.id);

                this.appendUpdateMaskData(newNpc, updateMaskData);
            });

            if(updateMaskData.getWriterIndex() !== 0) {
                npcUpdatePacket.writeBits(14, 16383);
                npcUpdatePacket.closeBitChannel();

                npcUpdatePacket.writeBytes(updateMaskData);
            } else {
                // No npc updates were appended, so just end the packet here
                npcUpdatePacket.closeBitChannel();
            }

            new Promise(resolve => {
                this.player.packetSender.send(npcUpdatePacket);
                resolve();
            });

            resolve();
        });
    }

    private appendUpdateMaskData(npc: Npc, updateMaskData: RsBuffer): void {
        const updateFlags = npc.updateFlags;
        if(!updateFlags.updateBlockRequired) {
            return;
        }

        let mask = 0;

        if(updateFlags.faceMob !== undefined) {
            mask |= 0x40;
        }
        if(updateFlags.chatMessages.length !== 0) {
            mask |= 0x20;
        }
        if(updateFlags.facePosition) {
            mask |= 0x8;
        }
        if(updateFlags.animation) {
            mask |= 0x2;
        }

        updateMaskData.writeUnsignedByte(mask);

        if(updateFlags.faceMob !== undefined) {
            const mob = updateFlags.faceMob;

            if(mob === null) {
                // Reset faced mob
                updateMaskData.writeUnsignedShortLE(65535);
            } else {
                let mobIndex = mob.worldIndex;

                if(mob instanceof Player) {
                    // Client checks if index is less than 32768.
                    // If it is, it looks for an NPC.
                    // If it isn't, it looks for a player (subtracting 32768 to find the index).
                    mobIndex += 32768 + 1;
                }

                updateMaskData.writeUnsignedShortLE(mobIndex);
            }
        }

        if(updateFlags.chatMessages.length !== 0) {
            const message = updateFlags.chatMessages[0];

            if(message.message) {
                updateMaskData.writeString(message.message);
            } else {
                updateMaskData.writeString('Undefined Message');
            }
        }

        if(updateFlags.facePosition) {
            const position = updateFlags.facePosition;
            updateMaskData.writeOffsetShortLE(position.x * 2 + 1);
            updateMaskData.writeShortLE(position.y * 2 + 1);
        }

        if(updateFlags.animation) {
            const animation = updateFlags.animation;

            if(animation === null || animation.id === -1) {
                // Reset animation
                updateMaskData.writeShortBE(-1);
                updateMaskData.writeNegativeOffsetByte(0);
            } else {
                const delay = updateFlags.animation.delay || 0;
                updateMaskData.writeShortBE(animation.id);
                updateMaskData.writeNegativeOffsetByte(delay);
            }
        }
    }

}
