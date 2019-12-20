import { Player } from '../player';
import { Task } from '../../../../../task/task';

export class PlayerTickTask extends Task<void> {

    private readonly player: Player;

    public constructor(player: Player) {
        super();
        this.player = player;
    }

    public execute(): Promise<void> {
        return new Promise<void>(resolve => {
            this.player.walkingQueue.process();

            if(this.player.updateFlags.mapRegionUpdateRequired) {
                this.player.packetSender.sendCurrentMapRegion();
            }

            resolve();
        });
    }

}
