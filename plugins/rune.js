const { dialogue, Emote, goto, execute } = require('../dist/world/actor/dialogue');
const { animationIds } = require('../dist/world/config/animation-ids');
const { gfxIds } = require('../dist/world/config/gfx-ids');
const { itemIds } = require('../dist/world/config/item-ids');
const { npcIds } = require('../dist/world/config/npc-ids');
const { objectIds } = require('../dist/world/config/object-ids');
const { soundIds } = require('../dist/world/config/sound-ids');
const { songs } = require('../dist/world/config/songs');
const { widgets, widgetScripts } = require('../dist/world/config/widget');
const { ActionType, RunePlugin } = require('../dist/plugins/plugin');
const { world } = require('../dist/game-server');
const { InteractingAction, loopingAction, walkToAction } = require('../dist/world/actor/player/action/action');
const { DamageType, Damage, Animation, Graphic, ChatMessage } = require('../dist/world/actor/update-flags');
const { Skill, Skills } = require('../dist/world/actor/skills');
const { Achievements, giveAchievement } = require('../dist/world/actor/player/achievements');
const { of } = require('rxjs');
const { delay } = require('rxjs/operators');

module.exports = {

    dialogue, Emote, goto, execute,

    animationIds, gfxIds, itemIds, npcIds, objectIds, soundIds, songs, widgets, widgetScripts,

    NPC_ACTION: ActionType.NPC_ACTION, BUTTON_ACTION: ActionType.BUTTON, WIDGET_ACTION: ActionType.WIDGET_ACTION,
    ITEM_ON_ITEM_ACTION: ActionType.ITEM_ON_ITEM_ACTION, ITEM_ACTION: ActionType.ITEM_ACTION,
    WORLD_ITEM_ACTION: ActionType.WORLD_ITEM_ACTION, OBJECT_ACTION: ActionType.OBJECT_ACTION,
    ITEM_ON_OBJECT_ACTION: ActionType.ITEM_ON_OBJECT_ACTION, ITEM_ON_NPC_ACTION: ActionType.ITEM_ON_NPC_ACTION,
    COMMAND_ACTION: ActionType.COMMAND, PLAYER_INIT: ActionType.PLAYER_INIT, NPC_INIT: ActionType.NPC_INIT,
    QUEST: ActionType.QUEST, RunePlugin,

    world, InteractingAction, loopingAction, walkToAction,

    DamageType, Damage, Animation, Graphic, ChatMessage, Skill, Skills, Achievements, giveAchievement,

    wait: async (waitLength) => {
        await of(null).pipe(delay(waitLength)).toPromise();
    }

};
