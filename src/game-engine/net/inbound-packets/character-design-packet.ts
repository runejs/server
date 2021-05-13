import { Player } from '@engine/world/actor/player/player';
import { PacketData } from '@engine/net/inbound-packets';


const characterDesignPacket = (player: Player, packet: PacketData) => {
    const { buffer } = packet;

    // @TODO verify validity of selections

    const gender = buffer.get();
    const models = new Array(7);
    const colors = new Array(5);

    for(let i = 0; i < models.length; i++) {
        models[i] = buffer.get();
    }

    for(let i = 0; i < colors.length; i++) {
        colors[i] = buffer.get();
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
    player.interfaceState.closeAllSlots();
};

export default {
    opcode: 231,
    size: 13,
    handler: characterDesignPacket
};
