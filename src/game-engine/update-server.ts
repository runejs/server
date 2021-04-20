import { ServerConfig } from '@engine/config/server-config';
import { logger } from '@runejs/core';
import { parseServerConfig } from '@runejs/core/net';
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
