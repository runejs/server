import { getFiles } from '@server/util/files';
import { logger } from '@runejs/core';
import { readFileSync } from "fs";

export async function loadConfigurationFiles<T>(configurationDir: string): Promise<{ [key: string]: T }> {
    let configs: { [key: string]: T } = {};

    for await(const path of getFiles(configurationDir)) {
        try {
            const configContent = JSON.parse(readFileSync(path, 'utf8'));

            if(configContent) {
                configs = { ...configs, ...configContent };
            }
        } catch(error) {
            logger.error(`Error loading configuration file at ${path}:`);
            logger.error(error);
        }
    }

    return configs;
}
