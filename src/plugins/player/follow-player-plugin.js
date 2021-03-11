module.exports = {
    type: 'player_action',
    options: 'follow',
    handler: details => details.player.follow(details.otherPlayer)
};
