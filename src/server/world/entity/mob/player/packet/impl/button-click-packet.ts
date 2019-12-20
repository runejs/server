import { IncomingPacket } from '../incoming-packet';

export class ButtonClickPacket extends IncomingPacket {

    handle(): void {
        const buttonId = this.packet.readShortBE();

        if(buttonId === 2458) {
            this.player.logout();
        } else {
            console.log(`Unhandled button ${buttonId} clicked.`);
        }
    }

}
