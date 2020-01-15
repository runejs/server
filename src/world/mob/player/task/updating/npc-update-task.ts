import { Task } from '@server/task/task';
import { Player } from '../../player';
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

            const nearbyNpcs = world.chunkManager.getSurroundingChunks(currentMapChunk).map(chunk => chunk.npcs).flat();

            this.player.trackedNpcs = updateTrackedMobs<Npc>(npcUpdatePacket, this.player.position,
                mob => this.appendUpdateMaskData(mob as Npc, updateMaskData), this.player.trackedNpcs, nearbyNpcs);

            registerNewMobs<Npc>(npcUpdatePacket, this.player, this.player.trackedNpcs, nearbyNpcs, mob => {
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

            this.player.packetSender.send(npcUpdatePacket);
            resolve();
        });
    }

    private appendUpdateMaskData(npc: Npc, updateMaskData: RsBuffer): void {
        const updateFlags = npc.updateFlags;
        if(!updateFlags.updateBlockRequired) {
            return;
        }

        const mask = 0;

        updateMaskData.writeUnsignedByte(mask);
    }

}
