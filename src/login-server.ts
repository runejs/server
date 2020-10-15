import { parseServerConfig } from '@server/world/config/server-config';
import { logger } from '@runejs/logger';
import { openLoginServer } from '@server/net/server/login-server';

const startLoginServer = (): void => {
    const serverConfig = parseServerConfig();

    if(!serverConfig) {
        logger.error('Unable to start login server due to missing or invalid server configuration.');
        return;
    }

    openLoginServer(serverConfig.loginServerHost, serverConfig.loginServerPort);
};

startLoginServer();
