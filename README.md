[![RuneJS Discord Server](https://img.shields.io/discord/678751302297059336?label=RuneJS%20Discord&logo=discord)](https://discord.gg/5P74nSh)


![RuneJS](https://i.imgur.com/osF9OSD.png)

# RuneJS

RuneJS is a RuneScape game server written entirely using TypeScript and JavaScript. The aim of this project is to create a game server that is both fun and easy to use, while also providing simple content development systems.

The server runs on the 435 revision of the game, which was a game update made on October 31st, 2006. There are not any plans to convert it to other versions at this time.

**RuneJS is completely open-source and open to all pull requests and/or issues. Many plugins have been added by contributor pull requests and we're always happy to have more!**

## Features
    
### Game Server

* RSA + ISAAC ciphering :heavy_check_mark:
* Game Update Server :heavy_check_mark:
* Authentication  :heavy_check_mark:
* Server side cache loading :heavy_check_mark:
    * Client pathing validation via cache mapdata :heavy_check_mark:
    * Item/object/npc definitions :heavy_check_mark:
* Packet queueing  :heavy_check_mark:

### Game World

* Bank :white_check_mark: 
    * Withdraw/Deposit 1,5,10,All :heavy_check_mark:
    * As note  :x: 
    * Swap slot :heavy_check_mark:
    * Insert mode: :x:
* Audio :white_check_mark:
    * Music :white_check_mark:
        * Playing music :heavy_check_mark:
        * Music Regions :x:
        * Music Player tab :x:
    * Sounds :white_check_mark:
        * Playing sounds :heavy_check_mark:
        * Sound effects for actions :white_check_mark:
* Climbing ladders :white_check_mark:
* Climbing stairs :white_check_mark:
* Lumbridge mill :white_check_mark:
    * Replacing objects for local player only :x:

### Skills

* Woodcutting :white_check_mark: 
    * Formula for success :white_check_mark:
    * Chopping Trees :white_check_mark: 
    * Axes :heavy_check_mark:
    * Birds nests  :x: 
    * Stump ids :white_check_mark: 
* Mining 
    * Formula for success :white_check_mark:
    * Mining ores :white_check_mark: 
    * Pickaxes :heavy_check_mark:
    * Random gems  :x: 
    * Gem ores :x:
    * Essence mining :x:
    * Empty Rock ids :white_check_mark: 
* Crafting
    * Spinning wheel :heavy_check_mark:

### Technical Features

* Asynchronous server infrastructure w/ Promises & RxJS
* A diverse TypeScript plugin system for easily writing new content based off of in-game actions
* A simplified JavaScript plugin system for quickly and easily bootstrapping game content
* Flexible quest and dialogue systems for more advanced content development
* A basic REST service for polling logged in users and game items
* Code compilation via Babel, offering more seamless compilation and redeployment of plugins

## Setup

1. Download and install NodeJS **version 13 or higher**: https://nodejs.org/en/
2. Clone the Github Repo: https://github.com/rune-js/server
3. Install dependencies by navigating to the project in your Terminal or command prompt and running the command npm install
4. Copy the `data/config/server-config-default.yaml` and paste it into the same folder using the name `server-config.yaml`
5. Go into your new `server-config.yaml` file and modify your RSA modulus and exponent with the ones matching your game client
  - You may also modify the server's port and host address from this configuration file
6. Run the game server and REST service by inputting the command `npm start`

The game server will spin up and be accessible via port 43594. The REST service can be accessed via port 8888.

## Cache Parsing

A separate package was created that RuneJS uses to parse the 435 game cache. This package decodes item definitions, npc definitions, location object definitions, widgets, sprites, and map data (tiles and location objects) for any implementing app to make use of.

The RuneJS `cache-parser` package can be found here:

- [Github: rune-js/cache-parser](https://github.com/rune-js/cache-parser)
- [NPM: @runejs/cache-parser](https://www.npmjs.com/package/@runejs/cache-parser)

## REST API

Online players can be polled via the REST protocol for web applications.

##### API Endpoints:

- `GET /players` : Returns a list of players currently logged into the game server
- `GET /items?page=x&limit=y` : Returns a list of item metadata loaded by the game server
- `GET /items/{itemId}` : Returns details about a specific item by id
- `PUT /items/{itemId}` : Updates an item's configurable server data

## Aditional Information

#### Supported 435 Clients

RuneJS supports the 435 RuneScape game client being renamed by [Promises](https://github.com/Promises) and [TheBlackParade](https://github.com/TheBlackParade):

- [refactored-client-435](https://github.com/Promises/refactored-client-435)

#### Update Server

RuneJS provides a fully working update server for the 435 client to use. The update server runs alongside the regular game server using the same port, so no additional configuration is required. Simply start the server and then your game client.
