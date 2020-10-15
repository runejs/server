import { parseServerConfig } from '@server/world/config/server-config';
import { logger } from '@runejs/logger';
import { openUpdateServer } from '@server/net/server/update-server';

const startUpdateServer = (): void => {
    const serverConfig = parseServerConfig();

    if(!serverConfig) {
        logger.error('Unable to start update server due to missing or invalid server configuration.');
        return;
    }

    openUpdateServer(serverConfig.updateServerHost, serverConfig.updateServerPort);
};

startUpdateServer();
