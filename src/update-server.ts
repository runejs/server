import { ServerConfig } from '@server/config/server-config';
import { logger, parseServerConfig } from '@runejs/core';
import { launchUpdateServer } from '@runejs/update-server';

const startUpdateServer = (): void => {
    const serverConfig = parseServerConfig<ServerConfig>();

    if(!serverConfig) {
        logger.error('Unable to start Update Server due to missing or invalid server configuration.');
        return;
    }

    launchUpdateServer(serverConfig.updateServerHost, serverConfig.updateServerPort, 'cache');
};

startUpdateServer();
