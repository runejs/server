import { playerInteractionActionHandler } from '@engine/world/action/player-interaction.action';
import { widgets } from '@engine/config';
import { ItemInteractionAction, itemInteractionActionHandler } from '@engine/world/action/item-interaction.action';
import { buttonActionHandler } from '@engine/world/action/button.action';
import { TradeSession } from '@plugins/player/trading/TradeSession';
import { Player } from '@engine/world/actor/player/player';
import { WidgetClosedEvent } from '@engine/world/actor/player/interface-state';

/*
    Trade Interface         335
    Trading confirmation    334
    Trading tab area        336
 */
export const trade : playerInteractionActionHandler = ({ player, otherPlayer }) => {

    const currentTime = Date.now();

    if(otherPlayer.metadata['currentTrade']) {
        player.sendMessage('Other player is busy at the moment. (trading atm)')
        otherPlayer.metadata['currentTrade'] = null;
        return;
    }
    if(otherPlayer.interfaceState.screenWidget) {
        player.sendMessage('Other player is busy at the moment.')
        return;
    }

    if(player.metadata['tradeRequests']) {
        const playerRequests = player.metadata['tradeRequests'];
        if(playerRequests[otherPlayer.username] && playerRequests[otherPlayer.username] + 10000 > currentTime) {
            player.sendMessage('starting trade');
            otherPlayer.sendMessage('starting trade');
            // Both parties have agreed to start a trade session;
            new TradeSession(player, otherPlayer);
            return;
        }
    }

    if(!otherPlayer.metadata['tradeRequests']) {
        otherPlayer.metadata['tradeRequests'] = {};
    }

    otherPlayer.metadata['tradeRequests'][player.username] = Date.now();
    otherPlayer.sendMessage(`${player.username}:tradereq:`);
    player.sendMessage(`Sending trade request...`);
};

export const offerItemToTrade : itemInteractionActionHandler = (itemInteractionAction: ItemInteractionAction) => {
    console.log('Offering item to trade: ');
    console.log('Username: ', itemInteractionAction.player.username);
    console.log('Item: ', itemInteractionAction.itemDetails.name);
    console.log('Option: ', itemInteractionAction.option);

    const { player } = itemInteractionAction;

    const tradingSession = player.metadata['currentTrade'];
    if(!tradingSession) {
        return;
    }

    tradingSession.addItem(player, itemInteractionAction, 1);
}


const removeItemFromTrade : itemInteractionActionHandler = (itemInteractionAction) => {
    console.log('Removing item from trade: ');
    console.log('Username: ', itemInteractionAction.player.username);
    console.log('Item: ', itemInteractionAction.itemDetails.name);
    console.log('Option: ', itemInteractionAction.option);

    const { player } = itemInteractionAction;
    const tradingSession = player.metadata['currentTrade'];

    tradingSession.removeItem(player, itemInteractionAction, 1);

}

export default {
    pluginId: 'rs:trading',
    hooks: [
        {
            options: 'trade with',
            type: 'player_interaction',
            handler: trade
        },
        {
            options: 'request_response',
            type: 'player_interaction',
            handler: trade
        },
        {
            options: ['offer-1', 'offer-5', 'offer-10', 'offer-all'],
            type: 'item_interaction',
            handler: offerItemToTrade
        },
        {
            options: ['remove-1', 'remove-5', 'remove-10', 'remove-all'],
            type: 'item_interaction',
            handler: removeItemFromTrade
        }
    ]
}
