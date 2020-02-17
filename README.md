[![RuneJS Discord Server](https://img.shields.io/discord/678751302297059336?label=RuneJS%20Discord&logo=discord)](https://discord.gg/5P74nSh)


![Rune.JS](https://i.imgur.com/osF9OSD.png)

# Rune.JS

Rune.JS is a RuneScape game server written entirely using TypeScript and JavaScript. The aim of this project is to create a game server that is both fun and easy to use, while also providing simple content development systems.

Currently the server is set up for the 377 revision of the game. There are not any plans to convert it to other versions at this time, though that could very well change. Any regular 377 client with RSA enabled should work with Rune.JS. 

## Features

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
- Player & NPC pathing validation via collision and tile maps generated from the game cache.
- Player client settings saving and loading.
- A basic REST service for polling logged in users.
- A diverse TypeScript plugin system for easily writing new content based off of in-game actions.

## Usage

1. Download and install Node.JS **version 12 or higher**: https://nodejs.org/en/
2. Clone the Github Repo: https://github.com/rune-js/server
3. Install dependencies by navigating to the project in your Terminal or command prompt and running the command npm install
4. Copy the `data/config/server-config-default.yaml` and paste it into the same folder using the name `server-config.yaml`. 
5. Go into your new `server-config.yaml` file and modify your RSA modulus and exponent with the ones matching your game client.
  - You may also modify the server's port and host address from this configuration file.
6. Run the game server and REST service by inputting the command npm run server

The game server will spin up and be accessible via port 43594. The REST service can be accessed via port 8888.

## Cache Parsing

A separate package was created that Rune.JS uses to parse the 377 game cache. This package parses item definitions, landscape object definitions, map region tiles, and map region landscape objects. The Rune.JS `cache-parser` package can be found here:

- [Github: rune-js/cache-parser](https://github.com/rune-js/cache-parser)
- [NPM: @runejs/cache-parser](https://www.npmjs.com/package/@runejs/cache-parser)

## REST API

Online players can be polled via the REST protocol for web applications. An accompanying server control panel UI is panned utilizing VueJS that will point to this REST service.

##### API Endpoints:

- `GET /players` : Returns a list of players currently logged into the game server.
- `GET /items?page=x&limit=y` : Returns a list of item metadata loaded by the game server.
- `GET /items/{itemId}` : Returns details about a specific item by id.
- `PUT /items/{itemId}` : Updates an item's configurable server data.

## Aditional Information

#### Supported 377 Clients

Rune.JS should support any vanilla RuneScape 377 client and game cache, such as:

- [refactored-client-377](https://github.com/Promises/refactored-client-377) by [Promises](https://github.com/Promises)
- [Runescape 377 Web client](https://github.com/reinismu/runescape-web-client-377) by [reinismu](https://github.com/reinismu)
- Any old 377 deobfuscated client

#### Update Server

To use Rune.JS, your 377 client's update server will either need to be disabled or you'll have to spin up your own update server alongside Rune.JS, as it does not include an update server of it's own.

We highly recommend using [JagCached](https://github.com/apollo-rsps/jagcached), a RuneScape update server written by [Graham Edgecombe](https://github.com/apollo-rsps/jagcached/commits?author=grahamedgecombe). 
