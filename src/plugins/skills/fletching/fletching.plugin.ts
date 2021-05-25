import { itemOnItemActionHandler } from '@engine/world/action/item-on-item.action';
import { Player } from '@engine/world/actor/player/player';
import { randomBetween } from '@engine/util/num';
import { itemIds } from '@engine/world/config/item-ids';
import { animationIds } from '@engine/world/config/animation-ids';
import { loopingEvent } from '@engine/game-server';
import { buttonActionHandler, ButtonAction } from '@engine/world/action/button.action';
import { Skill } from '@engine/world/actor/skills';
import { widgetButtonIds, widgetItems } from '@plugins/skills/smithing/smelting-constants';
import { soundIds } from '@engine/world/config/sound-ids';
import { colors } from '@engine/util/colors';
import { findItem, widgets } from '@engine/config';
import { Fletchable } from '@plugins/skills/fletching/fletching-types';
import { itemInteractionActionHandler } from '@engine/world/action/item-interaction.action';

//fletching stuff goes below this! lets do it!
