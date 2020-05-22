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

module.exports = {
    dialogue, Emote, goto, execute,
    animationIds, gfxIds, itemIds, npcIds, objectIds, soundIds, songs, widgets, widgetScripts,
    ActionType, RunePlugin,
    world
};
