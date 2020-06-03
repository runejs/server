[![RuneJS Discord Server](https://img.shields.io/discord/678751302297059336?label=RuneJS%20Discord&logo=discord)](https://discord.gg/5P74nSh)


![RuneJS](https://i.imgur.com/osF9OSD.png)

# RuneJS

RuneJS is a RuneScape game server written entirely using TypeScript and JavaScript. The aim of this project is to create a game server that is both fun and easy to use, while also providing simple content development systems.

Currently the server is set up for the 435 revision of the game, which was a game update made on October 31st, 2006. There are not any plans to convert it to other versions at this time.

## Features

- RSA and ISAAC ciphering support.
- Login & input/output packet handling.
- Player saving/loading via JSON files.
- Multiplayer support.
- Map region/chunk handling.
- Item inventory implementation.
  - Item definition parsing via the game cache.
  - Additional item data loading via YAML configuration.
  - Inventory item swapping.
- Player equipment with item bonuses & weight.
- NPC spawning and updating.
  - NPC spawn loading via YAML configuration.
- Player & NPC pathing validation via collision and tile maps generated from the 377 game cache.
- A basic REST service for polling logged in users.
- Full functional update server.
- A diverse TypeScript plugin system for easily writing new content based off of in-game actions.
- Flexible quest and dialogue systems for easy content development.

## Usage

1. Download and install Node.JS **version 13 or higher**: https://nodejs.org/en/
2. Clone the Github Repo: https://github.com/rune-js/server
3. Install dependencies by navigating to the project in your Terminal or command prompt and running the command npm install
4. Copy the `data/config/server-config-default.yaml` and paste it into the same folder using the name `server-config.yaml`. 
5. Go into your new `server-config.yaml` file and modify your RSA modulus and exponent with the ones matching your game client.
  - You may also modify the server's port and host address from this configuration file.
6. Run the game server and REST service by inputting the command npm run server

The game server will spin up and be accessible via port 43594. The REST service can be accessed via port 8888.

## Cache Parsing

A separate package was created that RuneJS uses to parse the 435 game cache. This package decodes item definitions, npc definitions, location object definitions, widgets, sprites, and map data (tiles and location objects) for any implementing app to make use of.

The RuneJS `cache-parser` package can be found here:

- [Github: rune-js/cache-parser](https://github.com/rune-js/cache-parser)
- [NPM: @runejs/cache-parser](https://www.npmjs.com/package/@runejs/cache-parser)

## REST API

Online players can be polled via the REST protocol for web applications.

##### API Endpoints:

- `GET /players` : Returns a list of players currently logged into the game server.
- `GET /items?page=x&limit=y` : Returns a list of item metadata loaded by the game server.
- `GET /items/{itemId}` : Returns details about a specific item by id.
- `PUT /items/{itemId}` : Updates an item's configurable server data.

## Aditional Information

#### Supported 435 Clients

RuneJS supports the 435 RuneScape game client being renamed by [Promises](https://github.com/Promises) and [TheBlackParade](https://github.com/TheBlackParade):

- [refactored-client-435](https://github.com/Promises/refactored-client-435)

#### Update Server

RuneJS provides a fully working update server for the 435 client to use. The update server runs alongside the regular game server using the same port, so no additional configuration is required. Simply start the server and then your game client.
