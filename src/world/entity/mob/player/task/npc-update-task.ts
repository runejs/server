import { Task } from '../../../../../task/task';
import { Player } from '../player';
import { Packet, PacketType } from '../../../../../net/packet';
import { RsBuffer } from '../../../../../net/rs-buffer';
import { Npc } from '../../npc/npc';
import { world } from '../../../../../game-server';
import { appendMovement } from './mob-updating';

/**
 * Handles the chonky npc updating packet for a specific player.
 */
export class NpcUpdateTask extends Task<void> {

    private readonly player: Player;

    public constructor(player: Player) {
        super();
        this.player = player;
    }

    public execute(): Promise<void> {
        return new Promise<void>(resolve => {
            const npcUpdatePacket: Packet = new Packet(71, PacketType.DYNAMIC_LARGE);
            npcUpdatePacket.openBitChannel();

            const playerPosition = this.player.position;
            const currentMapChunk = world.chunkManager.getChunkForWorldPosition(this.player.position);
            const updateMaskData = RsBuffer.create();

            let nearbyNpcs = world.chunkManager.getSurroundingChunks(currentMapChunk).map(chunk => chunk.npcs).flat();
            const existingTrackedNpcs: Npc[] = [];

            npcUpdatePacket.writeBits(8, this.player.trackedNpcs.length); // Tracked npc count

            if(this.player.trackedNpcs.length != 0) {
                for(let i = 0; i < this.player.trackedNpcs.length; i++) {
                    const trackedNpc = this.player.trackedNpcs[i];

                    if(trackedNpc && world.npcExists(trackedNpc) && nearbyNpcs.findIndex(p => p.equals(trackedNpc)) !== -1
                            && trackedNpc.position.withinViewDistance(playerPosition)) {
                        appendMovement(trackedNpc, npcUpdatePacket);
                        this.appendUpdateMaskData(trackedNpc, updateMaskData);
                        existingTrackedNpcs.push(trackedNpc);
                    } else {
                        npcUpdatePacket.writeBits(1, 1);
                        npcUpdatePacket.writeBits(2, 3);
                    }
                }
            }

            this.player.trackedNpcs = existingTrackedNpcs;

            // The client can only handle 80 new npcs at a time, so we limit each update to a max of 80
            // Any remaining npcs will be automatically picked up by subsequent updates
            let newNpcs = nearbyNpcs.filter(n1 => !this.player.trackedNpcs.find(n2 => n2.equals(n1)));
            if(newNpcs.length > 80) {
                // We also sort the list of players here by how close they are to the current player if there are more than 80, so we can render the nearest first
                newNpcs = newNpcs
                    .sort((a, b) => this.player.position.distanceBetween(a.position) - this.player.position.distanceBetween(b.position))
                    .slice(0, 80);
            }

            newNpcs.forEach((nearbyNpc, nearbyNpcIndex) => {
                if(!world.npcExists(nearbyNpc)) {
                    // Npc is no longer in the game world
                    return;
                }

                if(this.player.trackedNpcs.findIndex(n => n.equals(nearbyNpc)) !== -1) {
                    // Npc is already tracked by this player
                    return;
                }

                const positionOffsetX = nearbyNpc.position.x - this.player.position.x;
                const positionOffsetY = nearbyNpc.position.y - this.player.position.y;

                if(!nearbyNpc.position.withinViewDistance(this.player.position)) {
                    // Npc is still too far away to be worth rendering
                    // Also - values greater than 15 and less than -15 are too large, or too small, to be sent via 5 bits (max length of 32)
                    return;
                }

                // Only 255 npcs are able to be rendered at a time, so we cut it off it there are more than that
                if(this.player.trackedNpcs.length >= 255) {
                    return;
                }

                // Add npc to this player's list of tracked npcs
                this.player.trackedNpcs.push(nearbyNpc);

                // Notify the client of the new npc and their worldIndex
                npcUpdatePacket.writeBits(14, nearbyNpc.worldIndex + 1);
                npcUpdatePacket.writeBits(1, nearbyNpc.updateFlags.updateBlockRequired ? 1 : 0); // Update is required
                npcUpdatePacket.writeBits(5, positionOffsetY); // World Position Y axis offset relative to the player
                npcUpdatePacket.writeBits(5, positionOffsetX); // World Position X axis offset relative to the player
                npcUpdatePacket.writeBits(1, 1); // Discard client walking queues
                npcUpdatePacket.writeBits(13, nearbyNpc.id);

                this.appendUpdateMaskData(nearbyNpc, updateMaskData);
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

        let mask = 0;

        updateMaskData.writeUnsignedByte(mask);
    }

}
