import { getFiles } from '@engine/util/files';
import { logger } from '@runejs/core';
import { ActionHook } from '@engine/world/action/hooks';
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
    const pluginDir = './dist/plugins';
    const relativeDir = '../../plugins';
    const plugins: ContentPlugin[] = [];

    for await(const path of getFiles(pluginDir, ['.plugin.js'], true)) {
        const location = relativeDir + path.substring(pluginDir.length).replace('.js', '');

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
                logger.error(`Plugin ID not provided for .plugin file at ${path}`);
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
