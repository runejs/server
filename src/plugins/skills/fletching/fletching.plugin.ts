import { itemOnItemActionHandler } from '@engine/action';
import { Player } from '@engine/world/actor/player/player';
import { randomBetween } from '@engine/util/num';
import { itemIds } from '@engine/world/config/item-ids';
import { animationIds } from '@engine/world/config/animation-ids';
import { buttonActionHandler, ButtonAction } from '@engine/action';
import { Skill } from '@engine/world/actor/skills';
import { widgetButtonIds, widgetItems } from '@plugins/skills/smithing/smelting-constants';
import { soundIds } from '@engine/world/config/sound-ids';
import { colors } from '@engine/util/colors';
import { findItem, widgets } from '@engine/config/config-handler';
import { Fletchable } from '@plugins/skills/fletching/fletching-types';
import { itemInteractionActionHandler } from '@engine/action';
import { loopingEvent } from '@engine/plugins';

//fletching stuff goes below this! lets do it!

export default {
    pluginId: 'rs:fletching',
   
};
