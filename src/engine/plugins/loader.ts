import { loadPluginFiles } from '@engine/plugins/content-plugin';
import { Quest } from '@engine/world/actor';
import { logger } from '@runejs/core';
import { ActionHook, ActionType, sortActionHooks } from '@engine/action';

/**
 * A type for describing the plugin action hook map.
 */
type PluginActionHookMap = {
    [key in ActionType]?: ActionHook[];
};

/**
 * A type for describing the plugin action hook map.
 */
interface PluginQuestMap {
    [key: string]: Quest;
}

/**
 * A list of action hooks imported from content plugins.
 */
export let actionHookMap: PluginActionHookMap = {};
/**
 * A list of quests imported from content plugins.
 */
export let questMap: PluginQuestMap = {};

/**
 * Searches for and loads all plugin files and their associated action hooks.
 */
export async function loadPlugins(): Promise<void> {
    actionHookMap = {};
    questMap = {};
    const plugins = await loadPluginFiles();

    const pluginActionHookList = plugins?.filter(plugin => !!plugin?.hooks)?.map(plugin => plugin.hooks);

    if(pluginActionHookList && pluginActionHookList.length !== 0) {
        pluginActionHookList.reduce(
            (a, b) => a.concat(b))?.forEach(action => {
            if(!(action instanceof Quest)) {
                if(!actionHookMap[action.type]) {
                    actionHookMap[action.type] = [];
                }

                actionHookMap[action.type].push(action);
            } else {
                if(!actionHookMap['quest']) {
                    actionHookMap['quest'] = [];
                }

                actionHookMap['quest'].push(action);
            }
        });
    } else {
        logger.warn(`No action hooks detected - update plugins.`);
    }

    const pluginQuestList = plugins?.filter(plugin => !!plugin?.quests)?.map(plugin => plugin.quests);

    if(pluginQuestList && pluginQuestList.length > 0) {
        pluginQuestList.reduce((prev, curr) => prev.concat(curr))
            .forEach(quest => questMap[quest.id] = quest);
    }

    // @TODO implement proper sorting rules
    Object.keys(actionHookMap)
        .forEach(key => actionHookMap[key] =
            sortActionHooks(actionHookMap[key]));
}
