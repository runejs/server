import { launchLoginServer } from '@runejs/login-server';
import { logger, parseServerConfig } from '@runejs/core';
import { ServerConfig } from '@server/config/server-config';

const startLoginServer = (): void => {
    const serverConfig = parseServerConfig<ServerConfig>();

    if(!serverConfig) {
        logger.error('Unable to start Login Server due to missing or invalid server configuration.');
        return;
    }

    launchLoginServer(serverConfig.loginServerHost, serverConfig.loginServerPort,
        serverConfig.rsaMod, serverConfig.rsaExp, serverConfig.checkCredentials, 'data/saves');
};

startLoginServer();
