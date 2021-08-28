import { playerInteractionActionHandler } from '@engine/world/action/player-interaction.action';
import { widgets } from '@engine/config';
import { ItemContainer } from '@engine/world/items/item-container';
import { Player } from '@engine/world/actor/player/player';
import { ItemInteractionAction, itemInteractionActionHandler } from '@engine/world/action/item-interaction.action';
import { buttonActionHandler } from '@engine/world/action/button.action';
import { TradeSession } from '@plugins/player/trading/TradeSession';

// Holds the items that is currently being traded in.
let sourceTradeContainer : ItemContainer;
let targetTradeContainer : ItemContainer;

let sourceTradeableItemsContainer : ItemContainer;
let targetTradeableItemsContainer : ItemContainer;

let sourcePlayer : Player;
let targetPlayer : Player;

/*
    Trade Interface         335
    Trading confirmation    334
    Trading tab area        336
 */
export const trade : playerInteractionActionHandler = ({ player, otherPlayer }) => {

    const currentTime = Date.now();

    if(otherPlayer.metadata["currentTrade"]) {
        player.sendMessage("Other player is busy at the moment. (trading atm)")
        otherPlayer.metadata["currentTrade"] = null;
        return;
    }
    if(otherPlayer.interfaceState.screenWidget) {
        player.sendMessage("Other player is busy at the moment.")
        return;
    }

    if(player.metadata["tradeRequests"]) {
        const playerRequests = player.metadata["tradeRequests"];
        if(playerRequests[otherPlayer.username] && playerRequests[otherPlayer.username] + 10000 > currentTime) {
            player.sendMessage("starting trade");
            otherPlayer.sendMessage("starting trade");
            // Both parties have agreed to start a trade session;
            new TradeSession(player, otherPlayer);
            return;
        }
    }




    if(!otherPlayer.metadata["tradeRequests"]) {
        otherPlayer.metadata["tradeRequests"] = {};
    }

    otherPlayer.metadata["tradeRequests"][player.username] = Date.now();
    otherPlayer.sendMessage(`${player.username}:tradereq:`)
    player.sendMessage(`Sending trade request...`)

    // sourcePlayer = player;
    // sourceTradeContainer = new ItemContainer(28);
    // sourceTradeableItemsContainer = player.inventory;
    //
    // targetPlayer = otherPlayer;
    // targetTradeContainer = new ItemContainer(28);
    // targetTradeableItemsContainer = otherPlayer.inventory;
    //
    // openTradeWidget();
};

export const reloadPlayerWidgets = () => {
    sourcePlayer.outgoingPackets.sendUpdateAllWidgetItems(widgets.trading.tabarea, sourceTradeableItemsContainer);
    targetPlayer.outgoingPackets.sendUpdateAllWidgetItems(widgets.trading.tabarea, targetTradeableItemsContainer);

    targetPlayer.outgoingPackets.sendUpdateAllWidgetItems({
        widgetId: widgets.trading.firstStage.widgetId,
        containerId: widgets.trading.firstStage.source.containerId
    }, targetTradeContainer);

    targetPlayer.outgoingPackets.sendUpdateAllWidgetItems({
        widgetId: widgets.trading.firstStage.widgetId,
        containerId: widgets.trading.firstStage.target.containerId
    }, sourceTradeContainer);

    sourcePlayer.outgoingPackets.sendUpdateAllWidgetItems({
        widgetId: widgets.trading.firstStage.widgetId,
        containerId: widgets.trading.firstStage.source.containerId
    }, sourceTradeContainer);

    sourcePlayer.outgoingPackets.sendUpdateAllWidgetItems({
        widgetId: widgets.trading.firstStage.widgetId,
        containerId: widgets.trading.firstStage.target.containerId
    }, targetTradeContainer);
}

export const offerItemToTrade : itemInteractionActionHandler = (itemInteractionAction) => {


    console.log('Offering item to trade: ');
    console.log('Username: ', itemInteractionAction.player.username);
    console.log('Item: ', itemInteractionAction.itemDetails.name);
    console.log('Option: ', itemInteractionAction.option);

    const { option, player, itemDetails } = itemInteractionAction;

    const tradingSession = player.metadata["currentTrade"];
    if(!tradingSession) {
        return;
    }



    tradingSession.addItem(player, itemToTrade, theAmount);


    if (player.username === sourcePlayer.username) {
        sourceTradeContainer.add(itemDetails.gameId);
        sourceTradeableItemsContainer.removeFirst(itemDetails.gameId);
        reloadPlayerWidgets();
    }

    if (player.username === targetPlayer.username) {
        targetTradeContainer.add(itemDetails.gameId);
        targetTradeableItemsContainer.removeFirst(itemDetails.gameId);
        reloadPlayerWidgets();
    }
}

export const removeItemFromTrade : itemInteractionActionHandler = (itemInteractionAction) => {
    console.log('Removing item from trade: ');
    console.log('Username: ', itemInteractionAction.player.username);
    console.log('Item: ', itemInteractionAction.itemDetails.name);
    console.log('Option: ', itemInteractionAction.option);
}

export const abort : buttonActionHandler = (buttonAction) => {
    console.log('Close all widgets.');
    sourcePlayer.interfaceState.closeAllSlots();
    targetPlayer.interfaceState.closeAllSlots()
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
        },
        {
            type: 'button',
            widgetId: widgets.trading.firstStage.widgetId,
            buttonIds: [96],
            handler: abort
        }
    ]
}
