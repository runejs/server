import type { ActionType } from '@engine/action/action-pipeline';
import { type ActionHook, sortActionHooks } from '@engine/action/hook/action-hook';
import { loadPluginFiles } from '@engine/plugins/content-plugin';
import { Quest } from '@engine/world/actor/player/quest';
import { logger } from '@runejs/common';

/**
 * A type for describing the plugin action hook map.
 */
type PluginActionHookMap = { quest?: ActionHook[] } & {
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

    if (pluginActionHookList && pluginActionHookList.length !== 0) {
        pluginActionHookList
            .reduce((a, b) => (a || []).concat(b || []))
            ?.forEach(action => {
                if (!(action instanceof Quest)) {
                    if (!actionHookMap[action.type]) {
                        actionHookMap[action.type] = [];
                    }

                    actionHookMap[action.type]!.push(action);
                } else {
                    if (!actionHookMap['quest']) {
                        actionHookMap['quest'] = [];
                    }

                    actionHookMap['quest'].push(action);
                }
            });
    } else {
        logger.warn('No action hooks detected - update plugins.');
    }

    for (const plugin of plugins) {
        if (!plugin.quests) {
            continue;
        }

        for (const quest of plugin.quests) {
            questMap[quest.id] = quest;
        }
    }

    // @TODO implement proper sorting rules
    Object.keys(actionHookMap).forEach(key => (actionHookMap[key] = sortActionHooks(actionHookMap[key])));
}
