import { widgetInteractionActionHandler } from '@engine/world/action/widget-interaction.action';

const widgetIds = [
    158, 161, 175,
    167, 171, 170,
    168, 159, 177,
    165, 164, 163,
    160, 174, 169,
    166, 157, 176,
    173, 162, 172,
];

/**
 * Handles a level-up dialogue action.
 */
export const handler: widgetInteractionActionHandler = ({ player }) =>
    player.interfaceState.closeWidget('chatbox');

export default {
    pluginId: 'rs:close_level_up_message',
    hooks: [
        { type: 'widget_interaction', widgetIds, handler, cancelActions: false }
    ]
};
