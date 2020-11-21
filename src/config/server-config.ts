export interface ServerConfig {
    rsaMod: string;
    rsaExp: string;
    host: string;
    port: number;
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
