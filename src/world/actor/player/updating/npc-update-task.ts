import { Task } from '@server/task/task';
import { Player } from '../player';
import { Packet, PacketType } from '@server/net/packet';
import { Npc } from '@server/world/actor/npc/npc';
import { world } from '@server/game-server';
import { registerNewActors, updateTrackedActors } from './actor-updating';
import { ByteBuffer } from '@runejs/byte-buffer';

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
            const npcUpdatePacket: Packet = new Packet(128, PacketType.DYNAMIC_LARGE);
            npcUpdatePacket.openBitBuffer();

            const updateMaskData = new ByteBuffer(5000);

            const nearbyNpcs = world.npcTree.colliding({
                x: this.player.position.x - 15,
                y: this.player.position.y - 15,
                width: 32,
                height: 32
            });

            this.player.trackedNpcs = updateTrackedActors(npcUpdatePacket, this.player.position,
                actor => this.appendUpdateMaskData(actor as Npc, updateMaskData), this.player.trackedNpcs, nearbyNpcs) as Npc[];

            registerNewActors(npcUpdatePacket, this.player, this.player.trackedNpcs, nearbyNpcs, actor => {
                const newNpc = actor as Npc;
                const positionOffsetX = newNpc.position.x - this.player.position.x;
                const positionOffsetY = newNpc.position.y - this.player.position.y;

                // Add npc to this player's list of tracked npcs
                this.player.trackedNpcs.push(newNpc);

                // Notify the client of the new npc and their worldIndex
                npcUpdatePacket.putBits(15, newNpc.worldIndex);
                npcUpdatePacket.putBits(3, newNpc.faceDirection);
                npcUpdatePacket.putBits(5, positionOffsetX); // World Position X axis offset relative to the player
                npcUpdatePacket.putBits(5, positionOffsetY); // World Position Y axis offset relative to the player
                npcUpdatePacket.putBits(1, newNpc.updateFlags.updateBlockRequired ? 1 : 0); // Update is required
                npcUpdatePacket.putBits(1, 1); // Discard client walking queues
                npcUpdatePacket.putBits(13, newNpc.id);

                this.appendUpdateMaskData(newNpc, updateMaskData);
            });

            if(updateMaskData.writerIndex !== 0) {
                npcUpdatePacket.putBits(15, 32767);
                npcUpdatePacket.closeBitBuffer();

                npcUpdatePacket.putBytes(updateMaskData.flipWriter());
            } else {
                // No npc updates were appended, so just end the packet here
                npcUpdatePacket.closeBitBuffer();
            }

            this.player.outgoingPackets.queue(npcUpdatePacket, true);
            resolve();
        });
    }

    private appendUpdateMaskData(npc: Npc, updateMaskData: ByteBuffer): void {
        const updateFlags = npc.updateFlags;
        if(!updateFlags.updateBlockRequired) {
            return;
        }

        let mask = 0;

        if(updateFlags.damage !== null) {
            mask |= 0x1;
        }
        if(updateFlags.appearanceUpdateRequired) {
            mask |= 0x80;
        }
        if(updateFlags.faceActor !== undefined) {
            mask |= 0x4;
        }
        if(updateFlags.chatMessages.length !== 0) {
            mask |= 0x40;
        }
        if(updateFlags.facePosition) {
            mask |= 0x8;
        }
        if(updateFlags.animation) {
            mask |= 0x10;
        }

        updateMaskData.put(mask, 'BYTE');

        if(updateFlags.damage !== null) {
            const damage = updateFlags.damage;
            updateMaskData.put(damage.damageType);
            updateMaskData.put(damage.damageType.valueOf());
            updateMaskData.put(damage.remainingHitpoints);
            updateMaskData.put(damage.maxHitpoints);
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

            if(message.message) {
                updateMaskData.putString(message.message);
            } else {
                updateMaskData.putString('Undefined Message');
            }
        }

        if(updateFlags.appearanceUpdateRequired) {
            updateMaskData.put(npc.id, 'SHORT');
        }

        if(updateFlags.facePosition) {
            const position = updateFlags.facePosition;
            updateMaskData.put(position.x * 2 + 1, 'SHORT');
            updateMaskData.put(position.y * 2 + 1, 'SHORT', 'LITTLE_ENDIAN');
        }

        if(updateFlags.animation) {
            const animation = updateFlags.animation;

            if(animation === null || animation.id === -1) {
                // Reset animation
                updateMaskData.put(65535, 'SHORT');
                updateMaskData.put(0);
            } else {
                const delay = updateFlags.animation.delay || 0;
                updateMaskData.put(animation.id, 'SHORT');
                updateMaskData.put(delay);
            }
        }
    }

}
