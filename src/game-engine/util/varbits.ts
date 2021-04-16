import { filestore } from '@engine/game-server';

/**
 * Calculate the varbit masks
 * @returns an array of varbit masks
 */
export function calculateVarbitMasks() {
    const varbitMasks = [];
    if (varbitMasks.length === 0) {
        let i = 2;
        for (let i_7_ = 0; i_7_ < 32; i_7_++) {
            varbitMasks[i_7_] = -1 + i;
            i += i;
        }
    }
    return varbitMasks;
}

/**
 * Returns the index to morph actor/object into, based on set config
 * @param varbitId
 * @param playerConfig
 * @return index to morph into
 */
export function getVarbitMorphIndex(varbitId, playerConfig) {
    const varbitMasks = calculateVarbitMasks();
    const varbitDefinition = filestore.configStore.varbitStore.getVarbit(varbitId);
    const mostSignificantBit = varbitDefinition.mostSignificantBit;
    const configId = varbitDefinition.index;
    const leastSignificantBit = varbitDefinition.leastSignificantBit;
    const varbitMask = varbitMasks[mostSignificantBit - leastSignificantBit];
    const configValue = playerConfig && playerConfig[configId] ? playerConfig[configId] : 0;
    return ((configValue) >> leastSignificantBit & varbitMask);
}

/**
 * Returns the setting/config index from a varbitId
 * @param varbitId
 * @return the config ID for the varbit
 */
export function getVarbitConfigId(varbitId) {
    const varbitDefinition = filestore.configStore.varbitStore.getVarbit(varbitId);
    return varbitDefinition.index;
}

