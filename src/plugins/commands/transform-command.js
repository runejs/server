module.exports = {
    type: 'player_command',
    commands: 'transform',
    args: [{
        name: 'npcKey',
        type: 'either'
    }],
    action: details => details.player.transformInto(details?.args?.npcKey)
};
