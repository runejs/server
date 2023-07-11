import { Player } from '@engine/world/actor/player/player';
import {
    widgetInteractionActionHandler
} from '@engine/action';
import { activeWorld } from '@engine/world';

const INTRO_PAGE_COUNT = 1;
const ITEMS_PER_PAGE = 15;
const pageCount = INTRO_PAGE_COUNT + Math.round(activeWorld.travelLocations.locations.length / (ITEMS_PER_PAGE));

export function openTravel(player: Player, page: number) {
    const widget = player.interfaceState.openWidget(27, {
        slot: 'screen',
        fakeWidget: 3100002,
        metadata: {
            page: page
        }
    });

    // Prev page button
    player.modifyWidget(widget.widgetId, {
        childId: 95,
        hidden: widget.metadata.page === 1 // hide prev page button if we are on the first page
    })


    const isLastPage = (p) => pageCount === page * 2 // 2 "pages" per page

    // Next page buttton
    player.modifyWidget(widget.widgetId, {
        childId: 97,
        hidden: isLastPage(page)
    })

    // prev page label
    player.modifyWidget(widget.widgetId, {
        childId: 98,
        text: widget.metadata.page * 2 -1 === 1 ? `` : `Page ${widget.metadata.page * 2 -1} `
    })

    // next page label
    player.modifyWidget(widget.widgetId, {
        childId: 99,
        text: `Page ${widget.metadata.page * 2} <nbsp></nbsp>`
    })

    // clear default lines of both open pages
    for (let i = 0; i < (ITEMS_PER_PAGE * 2); i++) {
        player.modifyWidget(widget.widgetId, {
            childId: 33+i,
            text: '',
            hidden: true
        })
    }

    let currentLocation = ((ITEMS_PER_PAGE * 2) * ((page - INTRO_PAGE_COUNT) - 1) + (INTRO_PAGE_COUNT * ITEMS_PER_PAGE));

    const historyPage = [
        '<col=CCCCFF>Last locations</col>',
        '',
        '',
        ...(player.savedMetadata.lastTravel || new Array(10)).map((location: number | undefined) => location === undefined ? '' : activeWorld.travelLocations.locations[location]?.name),
    ]

    if(widget.metadata.page * 2 -1 === 1) {
        for (let i = 0; i < ITEMS_PER_PAGE * 2; i+=2) {
            player.modifyWidget(widget.widgetId, {
                childId: 101+i,
                text: historyPage[currentLocation + ITEMS_PER_PAGE] || '',
                hidden: false
            })
            currentLocation++;
        }
    } else{
        for (let i = 0; i < ITEMS_PER_PAGE * 2; i+=2) {
            player.modifyWidget(widget.widgetId, {
                childId: 101+i,
                text: activeWorld.travelLocations.locations[currentLocation]?.name || '',
                hidden: !activeWorld.travelLocations.locations[currentLocation]?.name
            })
            currentLocation++;
        }

    }



    for (let i = 0; i < 30; i+=2) {
        player.modifyWidget(widget.widgetId, {
            childId: 131+i-1,
            hidden: !activeWorld.travelLocations.locations[currentLocation]?.name
        })
        player.modifyWidget(widget.widgetId, {
            childId: 131+i,
            text: activeWorld.travelLocations.locations[currentLocation]?.name || '',
            hidden: !activeWorld.travelLocations.locations[currentLocation]?.name
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
    let selectedIndex: number | undefined = undefined;
    if(details.childId >= 101 && details.childId <= 129) {
        selectedIndex = (details.childId - 99)/2 - 1;
    }
    if(details.childId >= 131 && details.childId <= 159) {
        selectedIndex = ((details.childId - 129)/2 -1) + 15;
    }
    if(selectedIndex != undefined) {
        let teleportIndex = selectedIndex + (30 * (playerWidget.metadata.page-1));
        if(!details.player.savedMetadata.lastTravel) {
            details.player.savedMetadata.lastTravel = new Array(10);
        }

        if(teleportIndex < INTRO_PAGE_COUNT * ITEMS_PER_PAGE) {
            if(teleportIndex < 3 && teleportIndex > 12) {
                openTravel(details.player, playerWidget.metadata.page)
            }
            teleportIndex = details.player.savedMetadata.lastTravel[teleportIndex - 3]
            if(!teleportIndex) {
                openTravel(details.player, playerWidget.metadata.page)
            }
        } else {
            teleportIndex = teleportIndex - INTRO_PAGE_COUNT * ITEMS_PER_PAGE
        }

        const newTravelLog = [teleportIndex, ...details.player.savedMetadata.lastTravel.slice(0, 9)]
        for (let index = 1; newTravelLog.length; index++) {
            const element = newTravelLog[index];
            if (element === teleportIndex) {
                newTravelLog[index] = newTravelLog[index+1]
            }
            if(element === undefined) {
                if (newTravelLog[index + 1] === undefined) {
                    break;
                }
                newTravelLog[index] = newTravelLog[index+1];
            }
        }
        details.player.savedMetadata.lastTravel = newTravelLog;


        details.player.teleport(activeWorld.travelLocations.locations[teleportIndex].position)

        details.player.interfaceState.closeAllSlots()
    } else {
        openTravel(details.player, playerWidget.metadata.page)
    }
}
