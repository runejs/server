import { Player } from '@engine/world/actor/player/player';
import { world } from '@engine/game-server';
import {
    widgetInteractionActionHandler
} from '@engine/world/action/widget-interaction.action';

export function openTravel(player: Player, page: number) {
    const widget = player.interfaceState.openWidget(27, {
        slot: 'screen',
        fakeWidget: 3100002,
        metadata: {
            page: page
        }
    });
    player.modifyWidget(widget.widgetId, {
        childId: 95,
        hidden: widget.metadata.page === 1
    })

    player.modifyWidget(widget.widgetId, {
        childId: 97,
        hidden: Math.round(world.travelLocations.locations.length / 30) === page
    })

    player.modifyWidget(widget.widgetId, {
        childId: 98,
        text: `Page ${widget.metadata.page * 2 -1} `
    })
    player.modifyWidget(widget.widgetId, {
        childId: 99,
        text: `Page ${widget.metadata.page * 2} <nbsp></nbsp>`
    })

    for (let i = 0; i < 30; i++) {
        player.modifyWidget(widget.widgetId, {
            childId: 33+i,
            text: ''
        })
    }
    let currentLocation = 30 * (page - 1);
    for (let i = 0; i < 30; i+=2) {
        player.modifyWidget(widget.widgetId, {
            childId: 101+i,
            text: world.travelLocations.locations[currentLocation]?.name || '',
            hidden: !world.travelLocations.locations[currentLocation]?.name
        })
        currentLocation++;
    }
    for (let i = 0; i < 30; i+=2) {
        player.modifyWidget(widget.widgetId, {
            childId: 131+i-1,
            hidden: !world.travelLocations.locations[currentLocation]?.name
        })
        player.modifyWidget(widget.widgetId, {
            childId: 131+i,
            text: world.travelLocations.locations[currentLocation]?.name || '',
            hidden: !world.travelLocations.locations[currentLocation]?.name
        })
        currentLocation++;
    }

}

export const travelMenuInteract: widgetInteractionActionHandler = (details) => {
    const playerWidget = details.player.interfaceState.findWidget(27);

    if(!playerWidget || !playerWidget.metadata.page) {
        return;
    }
    switch (details.childId){
        case 160:
            openTravel(details.player, 1)
            return;
        case 94:
            openTravel(details.player, playerWidget.metadata.page-1)
            return;
        case 96:
            openTravel(details.player, playerWidget.metadata.page+1)
            return;
    }
    let selectedIndex = undefined;
    if(details.childId >= 101 && details.childId <= 129) {
        selectedIndex = (details.childId - 99)/2 - 1;
    }
    if(details.childId >= 131 && details.childId <= 159) {
        selectedIndex = ((details.childId - 129)/2 -1) + 15;
    }
    if(selectedIndex != undefined) {
        details.player.teleport(world.travelLocations.locations[selectedIndex + (30 * (playerWidget.metadata.page-1))].position)
        details.player.interfaceState.closeAllSlots()
    } else {
        openTravel(details.player, playerWidget.metadata.page)
    }
}
