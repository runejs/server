[![RuneJS Discord Server](https://img.shields.io/discord/678751302297059336?label=RuneJS%20Discord&logo=discord)](https://discord.gg/5P74nSh)

[![RuneJS](https://i.imgur.com/QSXNzwC.png)](https://github.com/runejs/)

# RuneJS Game Server

RuneJS is a RuneScape game server written in TypeScript and JavaScript. The aim of this project is to create a game server that is both fun and easy to use, while also providing simple content development systems.

The game server currently runs a build of RuneScape from October 30th-31st, 2006 (game build #435). No other builds are supported at this time, but may become available in the future.

**RuneJS is completely open-source and open to all pull requests and/or issues. Many plugins have been added by contributor pull requests and we're always happy to have more!**

![RuneJS Lumbridge](https://i.imgur.com/KVCqKSb.png)

## Setup

1. Download and install NodeJS **version 16 or higher**: https://nodejs.org/en/
2. Clone the Github Repo: https://github.com/runejs/server
3. Install dependencies by navigating to the project in your Terminal or command prompt and running the command npm install
4. Copy the `config/server-config.example.json` and paste it into the same folder using the name `server-config.json`
5. *Optional:* Go into the new `server-config.json` file and modify the RSA modulus and exponent with the ones matching your desired game client
  - You may also modify the server's port and host address from this configuration file
6. Run the game server with `npm start`

The game server will spin up and be accessible via port 43594.

### Setup using docker

1. Download and install Docker and Docker Compose: first https://docs.docker.com/get-docker/ then https://docs.docker.com/compose/install/ 
2. Copy the `config/server-config.example.json` and paste it into the same folder using the name `server-config.json`
3. Go into your new `server-config.json` file and modify your RSA modulus and exponent with the ones matching your game client
  - You may also modify the server's port and host address from this configuration file
4. Build the docker image with `docker-compose build`
5. Run the game server with `docker-compose up'

The game server will spin up and be accessible via port 43594.

## Game Client

The [RuneScape Java Client #435](https://github.com/runejs/refactored-client-435) must be used to log into a RuneJS game server.

## Additional Commands
* `npm run game` Launches the game server by itself without building
* `npm run game:dev` Builds and launches the game server by itself in watch mode
* `npm run login` Launches the login server by itself without building
* `npm run update` Launches the update server by itself without building
* `npm run infra` Launches both the login and update server without building
* `npm run standalone` Launches all three servers concurrently without building
* `npm run build:watch` Builds the application and watches for changes
* `npm run build` Builds the application
* `npm run lint` Runs the linter against the codebase to look for code style issues
