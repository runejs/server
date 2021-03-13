[![RuneJS Discord Server](https://img.shields.io/discord/678751302297059336?label=RuneJS%20Discord&logo=discord)](https://discord.gg/5P74nSh)


![RuneJS](https://i.imgur.com/pmkdSfc.png)

# RuneJS

RuneJS is a RuneScape game server written entirely using TypeScript and JavaScript. The aim of this project is to create a game server that is both fun and easy to use, while also providing simple content development systems.

The server runs on the 435 revision of the game, which was a game update made on October 31st, 2006. There are not any plans to convert it to other versions at this time.

**RuneJS is completely open-source and open to all pull requests and/or issues. Many plugins have been added by contributor pull requests and we're always happy to have more!**

![RuneJS Lumbridge](https://prnt.sc/10krr67)

## Setup

1. Download and install NodeJS **version 14 or higher**: https://nodejs.org/en/
2. Clone the Github Repo: https://github.com/rune-js/server
3. Install dependencies by navigating to the project in your Terminal or command prompt and running the command npm install
4. Copy the `data/config/server-config.example.yaml` and paste it into the same folder using the name `server-config.yaml`
5. Go into your new `server-config.yaml` file and modify your RSA modulus and exponent with the ones matching your game client
  - You may also modify the server's port and host address from this configuration file
6. Run the game server with `npm start`

The game server will spin up and be accessible via port 43594.

## Game Client

The [RuneScape Java Client #435](https://github.com/rune-js/refactored-client-435) must be used to log into a RuneJS game server.

## Additional Commands
* `npm run start:game` Launches the game server by itself without building
* `npm run start:game:dev` Builds and launches the game server by itself in watch mode
* `npm run start:login` Launches the login server by itself without building
* `npm run start:update` Launches the update server by itself without building
* `npm run start:infra` Launches both the login and update server without building
* `npm run start:standalone` Launches all three servers concurrently without building
* `npm run build:watch` Builds the application and watches for changes
* `npm run build` Builds the application
* `npm run lint` Runs the linter against the codebase to look for code style issues
