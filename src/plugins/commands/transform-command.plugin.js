module.exports = {
    pluginId: 'rs:transform_command',
    hooks: [
        {
            type: 'player_command',
            commands: 'transform',
            args: [ {
                name: 'npcKey',
                type: 'either',
                defaultValue: null
            } ],
            handler: details => details.player.transformInto(details && details.args ? details.args['npcKey'] : null)
        }
    ]
};
