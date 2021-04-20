import { launchLoginServer } from '@runejs/login-server';
import { logger } from '@runejs/core';
import { parseServerConfig } from '@runejs/core/net';
import { ServerConfig } from '@engine/config/server-config';


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
