module.exports = {
    type: 'player_command',
    commands: 'transform',
    args: [{
        name: 'npcKey',
        type: 'either',
        defaultValue: null
    }],
    action: details => details.player.transformInto(details && details.args ? details.args['npcKey'] : null)
};
