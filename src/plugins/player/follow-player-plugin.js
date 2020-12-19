module.exports = {
    type: 'player_action',
    options: 'follow',
    action: details => details.player.follow(details.otherPlayer)
};
