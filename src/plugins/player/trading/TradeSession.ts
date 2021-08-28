import { Player } from '@engine/world/actor/player/player';
import { ItemContainer } from '@engine/world/items/item-container';
import { widgets } from '@engine/config';
import { Item } from '@engine/world/items/item';
import { potatoManipulatePlayerInventory } from '@plugins/items/rotten-potato/hooks/rotten-potato-item-on-player';
import { itemIds } from '@engine/world/config/item-ids';

enum TradingStage {
    Initializing,
    Offer,
    Confirm
}

export class TradeSession {

    private player1: Player;
    private player2: Player;

    private player1Offer: ItemContainer = new ItemContainer(28);
    private player2Offer: ItemContainer = new ItemContainer(28);

    private tradingStage: TradingStage = TradingStage.Initializing;

    constructor(player1: Player, player2: Player) {
        this.player1 = player1;
        this.player2 = player2;
        player1.metadata['currentTrade'] = this;
        player2.metadata['currentTrade'] = this;
        this.openWidgets();
        this.tradingStage = TradingStage.Offer;
    }

    public reloadPlayerWidgets() {
        this.player1.outgoingPackets.sendUpdateAllWidgetItems(widgets.trading.tabarea, this.player1.inventory);
        this.player2.outgoingPackets.sendUpdateAllWidgetItems(widgets.trading.tabarea, this.player2.inventory);

        this.player2.outgoingPackets.sendUpdateAllWidgetItems({
            widgetId: widgets.trading.firstStage.widgetId,
            containerId: widgets.trading.firstStage.source.containerId
        }, this.player2Offer);

        this.player2.outgoingPackets.sendUpdateAllWidgetItems({
            widgetId: widgets.trading.firstStage.widgetId,
            containerId: widgets.trading.firstStage.target.containerId
        }, this.player1Offer);

        this.player1.outgoingPackets.sendUpdateAllWidgetItems({
            widgetId: widgets.trading.firstStage.widgetId,
            containerId: widgets.trading.firstStage.source.containerId
        }, this.player1Offer);

        this.player1.outgoingPackets.sendUpdateAllWidgetItems({
            widgetId: widgets.trading.firstStage.widgetId,
            containerId: widgets.trading.firstStage.target.containerId
        }, this.player2Offer);
    }

    /**
     * Add an item to the trade offer.
     * @param player
     * @param itemId
     * @param amount
     * @private
     */
    public addItem(player: Player, itemId: number, amount: number) {
        const tradingSession = player.metadata['currentTrade'];

        if(player.username === this.player1.username) {
            this.player1Offer.add({ itemId: itemId, amount: amount });
            this.player1.inventory.removeFirst(itemId);
            tradingSession.reloadPlayerWidgets();
        }

        if(player.username === this.player2.username) {
            this.player2Offer.add({ itemId: itemId, amount: amount });
            this.player2.inventory.removeFirst(itemId);
            tradingSession.reloadPlayerWidgets();
        }
    }

    /**
     * Remove an item from the trade offer.
     * @param player
     * @param itemId
     * @param amount
     * @private
     */
    public removeItem(player: Player, itemId: number, amount: number) {
        const tradingSession = player.metadata['currentTrade'];

        if(player.username === this.player1.username) {
            this.player1Offer.removeFirst({ itemId: itemId, amount: amount });
            this.player1.inventory.removeFirst({ itemId: itemId, amount: amount });
            tradingSession.reloadPlayerWidgets();
        }

        if(player.username === this.player2.username) {
            this.player2Offer.removeFirst({ itemId: itemId, amount: amount });
            this.player2.inventory.add({ itemId: itemId, amount: amount });
            tradingSession.reloadPlayerWidgets();
        }
    }

    /**
     * Open the trading widgets for both players.
     * @private
     */
    public openWidgets() {
        // Open trading interface on target players screen.
        this.player1.interfaceState.openWidget(335, {
            slot: 'screen',
            multi: true
        });

        this.player1.interfaceState.openWidget(336, {
            slot: 'tabarea',
            multi: true
        });

        this.player1.modifyWidget(widgets.trading.firstStage.widgetId, {
            childId: widgets.trading.firstStage.titleId,
            text: 'Trading With: ' + this.player2.username
        });

        this.player1.interfaceState.openWidget(336, {
            slot: 'tabarea',
            multi: true,
        });

        // Open trading interface on source player screen.
        this.player2.interfaceState.openWidget(335, {
            slot: 'screen',
            multi: true,
        });

        this.player2.modifyWidget(widgets.trading.firstStage.widgetId, {
            childId: widgets.trading.firstStage.titleId,
            text: 'Trading With: ' + this.player1.username
        });

        this.player2.interfaceState.openWidget(336, {
            slot: 'tabarea',
            multi: true
        });

        this.reloadPlayerWidgets();
    }

    public abort() {
        // Close all widgets.
        this.player1.interfaceState.closeAllSlots();
        this.player2.interfaceState.closeAllSlots();

        // Reset the 'current trade' metadata.
        this.player1.metadata['currentTrade'] = null;
        this.player2.metadata['currentTrade'] = null;

        this.player1.metadata['tradeCloseListener'] = null;
        this.player2.metadata['tradeCloseListener'] = null;
    }

}
