import { logger } from '@runejs/core';
import { getFiles } from '@runejs/core/fs';
import { join } from 'path';

import { ActionHook } from '@engine/action/hook';
import { Quest } from '@engine/world/actor/player/quest';


/**
 * The definition of a single content plugin.
 */
export class ContentPlugin {
    public pluginId: string;
    public hooks?: ActionHook[];
    public quests?: Quest[];
}


/**
 * Searches for and parses all plugin files within the /plugins directory.
 */
export async function loadPluginFiles(): Promise<ContentPlugin[]> {
    const pluginDir = join('.', 'dist', 'plugins');
    const relativeDir = join('..', '..', 'plugins');
    const plugins: ContentPlugin[] = [];

    for await(const path of getFiles(pluginDir, { type: 'whitelist', list: ['.plugin.js', 'index.js'] })) {
        const location = join(relativeDir, path.substring(pluginDir.length).replace('.js', ''));

        try {
            let pluginFile = require(location);
            if(!pluginFile) {
                continue;
            }

            if(pluginFile.default) {
                pluginFile = pluginFile.default;
            }

            const plugin = pluginFile as ContentPlugin;
            if(!plugin.pluginId) {
                logger.error(`Error loading plugin: Plugin ID not provided for .plugin file at ${path}`);
                continue;
            }

            if(plugins.find(loadedPlugin => loadedPlugin.pluginId === plugin.pluginId)) {
                logger.error(`Error loading plugin: Duplicate plugin ID ${plugin.pluginId} at ${path}`);
                continue;
            }

            plugins.push(plugin);
        } catch(error) {
            logger.error(`Error loading plugin file at ${location}:`);
            logger.error(error);
        }
    }

    return plugins;
}
