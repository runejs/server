import { incomingPacket } from '../incoming-packet';
import { Player } from '../../world/actor/player/player';
import { RsBuffer } from '@server/net/rs-buffer';
import { widgets } from '../../world/config/widget';

export const characterDesignPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    if(!player.activeWidget || player.activeWidget.widgetId !== widgets.characterDesign) {
        return;
    }

    // @TODO verify validity of selections

    const gender: number = packet.readByte();
    const models: number[] = new Array(7);
    const colors: number[] = new Array(5);

    for(let i = 0; i < models.length; i++) {
        models[i] = packet.readByte();
    }

    for(let i = 0; i < colors.length; i++) {
        colors[i] = packet.readByte();
    }

    player.appearance = {
        gender,
        head: models[0],
        facialHair: models[1],
        torso: models[2],
        arms: models[3],
        hands: models[4],
        legs: models[5],
        feet: models[6],
        hairColor: colors[0],
        torsoColor: colors[1],
        legColor: colors[2],
        feetColor: colors[3],
        skinColor: colors[4]
    };

    player.updateFlags.appearanceUpdateRequired = true;
    player.closeActiveWidget();
};
