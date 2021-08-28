import { Player } from '@engine/world/actor/player/player';
import { ItemContainer } from '@engine/world/items/item-container';
import { widgets } from '@engine/config';

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

    private openWidgets() {
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
        // reloadPlayerWidgets();
    }



}
