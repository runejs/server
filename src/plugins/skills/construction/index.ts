import { PlayerCommandAction } from '@engine/action';
import { PlayerInitAction } from '@engine/action';
import { instance1, instance1Max, instance2, instance2Max, roomBuilderButtonMap } from './con-constants';
import { doorHotspotHandler, roomBuilderWidgetHandler } from '@plugins/skills/construction/room-builder';
import { openHouse } from '@plugins/skills/construction/house';
import { saveHouse } from '@plugins/skills/construction/home-saver';


export default {
    pluginId: 'rs:construction',
    hooks: [
        {
            type: 'button',
            widgetIds: 402,
            buttonIds: Object.keys(roomBuilderButtonMap).map(key => parseInt(key, 10)),
            handler: roomBuilderWidgetHandler
        },
        {
            type: 'object_interaction',
            objectIds: [ 15313, 15314 ],
            options: 'build',
            walkTo: true,
            handler: doorHotspotHandler
        },
        {
            type: 'player_command',
            commands: [ 'con', 'poh', 'house' ],
            handler: ({ player }: PlayerCommandAction): void => openHouse(player)
        },
        {
            type: 'player_command',
            commands: [ 'savepoh', 'savehouse' ],
            handler: ({ player }: PlayerCommandAction): void => {
                player.sendMessage(`Saving house data...`);
                saveHouse(player);
            }
        },
        {
            type: 'player_init',
            handler: ({ player }: PlayerInitAction): void => {
                if(player.position.within(instance1, instance1Max, false) ||
                    player.position.within(instance2, instance2Max, false)) {
                    openHouse(player);
                }
            }
        }
    ]
};
