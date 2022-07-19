export interface GameServerConfig {
    rsaMod: string;
    rsaExp: string;
    host: string;
    port: number;
    encryptionEnabled: boolean;
    loginServerHost: string;
    loginServerPort: number;
    updateServerHost: string;
    updateServerPort: number;
    showWelcome: boolean;
    expRate: number;
    giveAchievements: boolean;
    checkCredentials: boolean;
    tutorialEnabled: boolean;
    adminDropsEnabled: boolean;
}
