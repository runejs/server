import { Player } from '@server/world/actor/player/player';
import { world } from '@server/game-server';

export enum PrivateChatMode {
    PUBLIC = 0,
    FRIENDS = 1,
    OFF = 2
}

export class PrivateMessaging {

    public static friendAdded(player: Player, friendName: string): void {
        friendName = friendName.toLowerCase();
        const friend = world?.findPlayer(friendName);
    }

    public static friendRemoved(player: Player, friendName: string): void {
        friendName = friendName.toLowerCase();
        const playerPrivateChatMode = player.settings.privateChatMode;
        const playerUsername = player.username.toLowerCase();
        if(playerPrivateChatMode !== PrivateChatMode.PUBLIC) {
            const friend = world?.findPlayer(friendName);
            if(friend && friend.friendsList.indexOf(playerUsername) !== -1) {
                // Friend being removed is currently online - update their friends list if they have this player added
                friend.outgoingPackets.updateFriendStatus(player.username, 0);
            }
        }
    }

    /**
     * Updates a specific player's entire friends list.
     * @param player The player to update.
     */
    public static updateFriendsList(player: Player): void {
        const friends = player.friendsList;
        if(friends && friends.length !== 0) {
            const onlineFriends = world.playerList.filter(p => p && friends.indexOf(p.username.toLowerCase()) !== -1);

            friends.forEach(friendName => {
                const friend = onlineFriends.find(p => p.username.toLowerCase() === friendName);
                if(!friend || friend.settings.privateChatMode === PrivateChatMode.OFF) {
                    player.outgoingPackets.updateFriendStatus(friendName, 0);
                } else {
                    if(friend.settings.privateChatMode === PrivateChatMode.PUBLIC) {
                        player.outgoingPackets.updateFriendStatus(friendName, 1);
                    } else {
                        const otherPlayerFriendsList = friend.friendsList;
                        player.outgoingPackets.updateFriendStatus(friendName,
                            otherPlayerFriendsList.indexOf(player.username.toLowerCase()) !== -1 ? 1 : 0);
                    }
                }
            });
        }
    }

    /**
     * Called when the provided player logs in or changes their private chat mode.
     * @param player The player logging in.
     * @param updating If the friends list status is being updated or set initially.
     */
    public static playerPrivateChatModeChanged(player: Player, updating: boolean = true): void {
        const playerName = player.username.toLowerCase();
        const playerPrivateChatMode: PrivateChatMode = player.settings.privateChatMode;
        const playerFriendsList = player.friendsList || [];

        if(playerPrivateChatMode !== PrivateChatMode.OFF || updating) {
            const otherPlayers = world.playerList.filter(p => p && p.friendsList.indexOf(playerName) !== -1);
            if(otherPlayers && otherPlayers.length !== 0) {
                otherPlayers.forEach(otherPlayer => {
                    let worldId = playerPrivateChatMode === PrivateChatMode.OFF ? 0 : 1;

                    if(playerPrivateChatMode === PrivateChatMode.FRIENDS) {
                        if(playerFriendsList.findIndex(playerName => playerName === otherPlayer.username.toLowerCase()) === -1) {
                            worldId = 0;
                        }
                    }

                    otherPlayer.outgoingPackets.updateFriendStatus(player.username, worldId);
                });
            }
        }
    }

    public static playerLoggedIn(player: Player): void {
        PrivateMessaging.playerPrivateChatModeChanged(player, false);
        PrivateMessaging.updateFriendsList(player);
    }

}
