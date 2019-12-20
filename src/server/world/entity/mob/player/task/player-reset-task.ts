import { Player } from '../player';
import { Task } from '../../../../../task/task';

export class PlayerResetTask extends Task<void> {

    private readonly player: Player;

    public constructor(player: Player) {
        super();
        this.player = player;
    }

    public execute(): Promise<void> {
        return new Promise<void>(resolve => {
            this.player.updateFlags.reset();
            resolve();
        });
    }

}
