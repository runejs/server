import { filestore } from '@server/game/game-server';

const varbitMasks: number[] = [];

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

    if(!varbitDefinition) {
        throw new Error(`Could not find varbit definition for id ${varbitId}`);
    }

    const mostSignificantBit = varbitDefinition.mostSignificantBit;
    const configId = varbitDefinition.index;
    const leastSignificantBit = varbitDefinition.leastSignificantBit;
    // TODO: Unknown
    const i_8_ = varbitMasks[mostSignificantBit - leastSignificantBit];
    const configValue = playerConfig && playerConfig[configId] ? playerConfig[configId] : 0;
    return ((configValue) >> leastSignificantBit & i_8_);
}
