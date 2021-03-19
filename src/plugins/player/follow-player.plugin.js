module.exports = {
    pluginId: 'rs:follow_player',
    hooks: [
        {
            type: 'player_interaction',
            options: 'follow',
            handler: details => details.player.follow(details.otherPlayer)
        }
    ]
};
