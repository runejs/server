import { IncomingPacket } from '../incoming-packet';

export class WalkPacket extends IncomingPacket {

    handle(): void {
        let size = this.packetSize;

        if(this.packetId === 213) {
            size -= 14;
        }

        const totalSteps = Math.floor((size - 5) / 2);

        const firstX = this.packet.readNegativeOffsetShortLE();
        const runSteps = this.packet.readByte() === 1;
        const firstY = this.packet.readNegativeOffsetShortLE();

        const walkingQueue = this.player.walkingQueue;

        walkingQueue.clear();
        walkingQueue.valid = true;
        walkingQueue.add(firstX, firstY);

        for(let i = 0; i < totalSteps; i++) {
            const x = this.packet.readByte();
            const y = this.packet.readNegativeOffsetByte();
            walkingQueue.add(x + firstX, y + firstY);
        }
    }

}
