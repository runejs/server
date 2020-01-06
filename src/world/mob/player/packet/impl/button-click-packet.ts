import { incomingPacket } from '../incoming-packet';
import { Player } from '../../player';
import { RsBuffer } from '@server/net/rs-buffer';

const ignoreButtons: number[] = [
    3651 // character design accept button
];

const settingButtons: number[] = [
    152, 153, // walk/run
    930, 931, 932, 933, 934, // music volume
    941, 942, 943, 944, 945, // sound effect volume
    957, 958, // split private chat
    913, 914, // mouse buttons
    906, 908, 910, 912, // screen brightness
    915, 916, // chat effects
    12464, 12465, // accept aid
    150, 151, // auto retaliate
];

export const buttonClickPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    const buttonId = packet.readShortBE();

    if(buttonId === 2458) {
        player.logout();
    } else if(settingButtons.indexOf(buttonId) !== -1) {
        player.settingChanged(buttonId);
    } else if(ignoreButtons.indexOf(buttonId) === -1) {
        console.log(`Unhandled button ${buttonId} clicked.`);
    }
};
