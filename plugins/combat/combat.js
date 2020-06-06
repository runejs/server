const { NPC_ACTION, DamageType, wait } = require('../rune.js');

const action = async details => {
    const { player, npc } = details;

    npc.updateFlags.addDamage(1, DamageType.DAMAGE, 4, 5);
    npc.say(`Ow!`);

    await wait(100);

    player.updateFlags.addDamage(1, DamageType.DAMAGE, 9, 10);
};

module.exports = {
    type: NPC_ACTION,
    options: 'attack',
    walkTo: true,
    action
};
