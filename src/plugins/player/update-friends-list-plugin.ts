import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { playerInitAction } from '@server/world/actor/player/player';
import { world } from '@server/game-server';

export const action: playerInitAction = (details) => {
    const { player } = details;

    const playerName = player.username.toLowerCase();

    // Update online players friends lists that have this player as a friend
    const otherPlayers = world.playerList.filter(p => p && p.friendsList.indexOf(playerName) !== -1);
    if(otherPlayers && otherPlayers.length !== 0) {
        otherPlayers.forEach(otherPlayer => otherPlayer.outgoingPackets.updateFriendStatus(player.username, 1));
    }

    // Update this player's friends list
    const friends = player.friendsList;
    if(friends && friends.length !== 0) {
        const onlineFriends = world.playerList.filter(p => p && friends.indexOf(p.username.toLowerCase()) !== -1);
        onlineFriends.forEach(friend => player.outgoingPackets.updateFriendStatus(friend.username, 1));
        const onlineFriendNames = onlineFriends.map(friend => friend.username.toLowerCase());
        friends.filter(friendName => onlineFriendNames.find(onlineFriend => onlineFriend === friendName))
            .forEach(friend => player.outgoingPackets.updateFriendStatus(friend, 0));
    }

    player.outgoingPackets.sendFriendServerStatus(2);
};

export default new RunePlugin({ type: ActionType.PLAYER_INIT, action });
