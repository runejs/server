import { RsBuffer } from '../../../../../net/rs-buffer';
import { Mob } from '../../mob';

export const appendMovement = (mob: Mob, packet: RsBuffer): void => {
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
};
