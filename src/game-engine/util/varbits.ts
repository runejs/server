import { filestore } from '@engine/game-server';
import { findNpc } from '@engine/config/config-handler';
import { logger } from '@runejs/core';
import { Npc } from '@engine/world/actor/npc';
import { Player } from '@engine/world/actor/player/player';

const varbitMasks = [];

/**
 * Returns the index to morph actor/object into, based on set config
 * @param varbitId
 * @param playerConfig
 * @return index to morph into
 */
export function getVarbitMorphIndex(varbitId, playerConfig) {
    if(varbitMasks.length === 0) {
        let i = 2;
        for (let i_7_ = 0; i_7_ < 32; i_7_++) {
            varbitMasks[i_7_] = -1 + i;
            i += i;
        }
    }
    const varbitDefinition = filestore.configStore.varbitStore.getVarbit(varbitId);
    const mostSignificantBit = varbitDefinition.mostSignificantBit;
    const configId = varbitDefinition.index;
    const leastSignificantBit = varbitDefinition.leastSignificantBit;
    // TODO: Unknown
    const i_8_ = varbitMasks[mostSignificantBit - leastSignificantBit];
    const configValue = playerConfig && playerConfig[configId] ? playerConfig[configId] : 0;
    return ((configValue) >> leastSignificantBit & i_8_);
}

