import { RsBuffer } from '@server/net/rs-buffer';
import { Mob } from '@server/world/mob/mob';
import { world } from '@server/game-server';
import { Packet } from '@server/net/packet';
import { Npc } from '@server/world/mob/npc/npc';
import { Player } from '../player';
import { Position } from '@server/world/position';
import { QuadtreeKey } from '@server/world/world';

/**
 * Handles the registration of nearby NPCs or Players for the specified player.
 */
export function registerNewMobs(packet: Packet, player: Player, trackedMobs: Mob[], nearbyMobs: QuadtreeKey[], registerMob: (mob: Mob) => void): void {
    if(trackedMobs.length >= 255) {
        return;
    }

    // The client can only handle 80 new players or npcs at a time, so we limit each update to a max of 80
    // Any remaining players or npcs will be automatically picked up by subsequent updates
    let newMobs: QuadtreeKey[] = nearbyMobs.filter(m1 => !trackedMobs.includes(m1.mob));
    if(newMobs.length > 20) {
        // We also sort the list of players or npcs here by how close they are to the current player if there are more than 80, so we can render the nearest first
        newMobs = newMobs
            .sort((a, b) => player.position.distanceBetween(a.mob.position) - player.position.distanceBetween(b.mob.position))
            .slice(0, 20);
    }

    for(const newMob of newMobs) {
        const nearbyMob = newMob.mob;

        if(nearbyMob instanceof Player) {
            if(player.equals(nearbyMob)) {
                // Other player is actually this player!
                continue;
            }

            if(!world.playerExists(nearbyMob)) {
                // Other player is no longer in the game world
                continue;
            }
        } else if(nearbyMob instanceof Npc) {
            if(!world.npcExists(nearbyMob)) {
                // Npc is no longer in the game world
                continue;
            }
        }

        if(trackedMobs.findIndex(m => m.equals(nearbyMob)) !== -1) {
            // Npc or other player is already tracked by this player
            continue;
        }

        if(!nearbyMob.position.withinViewDistance(player.position)) {
            // Player or npc is still too far away to be worth rendering
            // Also - values greater than 15 and less than -15 are too large, or too small, to be sent via 5 bits (max length of 32)
            continue;
        }

        // Only 255 players or npcs are able to be rendered at a time
        // To help performance, we limit it to 200 here
        if(trackedMobs.length >= 255) {
            return;
        }

        registerMob(nearbyMob);
    }
}

/**
 * Handles updating of nearby NPCs or Players for the specified player.
 */
export function updateTrackedMobs(packet: Packet, playerPosition: Position, appendUpdateMaskData: (mob: Mob) => void, trackedMobs: Mob[], nearbyMobs: QuadtreeKey[]): Mob[] {
    packet.writeBits(8, trackedMobs.length); // Tracked mob count

    if(trackedMobs.length === 0) {
        return [];
    }

    const existingTrackedMobs: Mob[] = [];

    for(let i = 0; i < trackedMobs.length; i++) {
        const trackedMob: Mob = trackedMobs[i];
        let exists = true;

        if(trackedMob instanceof Player) {
            if(!world.playerExists(trackedMob as Player)) {
                exists = false;
            }
        } else {
            if(!world.npcExists(trackedMob as Npc)) {
                exists = false;
            }
        }

        if(exists && nearbyMobs.findIndex(m => m.mob.equals(trackedMob)) !== -1
                && trackedMob.position.withinViewDistance(playerPosition)) {
            appendMovement(trackedMob, packet);
            appendUpdateMaskData(trackedMob);
            existingTrackedMobs.push(trackedMob);
        } else {
            packet.writeBits(1, 1);
            packet.writeBits(2, 3);
        }
    }

    return existingTrackedMobs;
}

/**
 * Applends movement data of a player or NPC to the specified updating packet.
 */
export function appendMovement(mob: Mob, packet: RsBuffer): void {
    if(mob.walkDirection !== -1) {
        // Mob is walking/running
        packet.writeBits(1, 1); // Update required

        if(mob.runDirection === -1) {
            // Mob is walking
            packet.writeBits(2, 1); // Mob walking
            packet.writeBits(3, mob.walkDirection);
        } else {
            // Mob is running
            packet.writeBits(2, 2); // Mob running
            packet.writeBits(3, mob.walkDirection);
            packet.writeBits(3, mob.runDirection);
        }

        packet.writeBits(1, mob.updateFlags.updateBlockRequired ? 1 : 0); // Whether or not an update flag block follows
    } else {
        // Did not move
        if(mob.updateFlags.updateBlockRequired) {
            packet.writeBits(1, 1); // Update required
            packet.writeBits(2, 0); // Signify the player did not move
        } else {
            packet.writeBits(1, 0); // No update required
        }
    }
}
