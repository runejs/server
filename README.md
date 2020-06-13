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

* Bank :yellow_square: 
    * Withdraw/Deposit 1,5,10,All :heavy_check_mark:
    * As note  :heavy_check_mark: 
    * Swap slot :heavy_check_mark:
    * Insert mode: :heavy_check_mark:
    * Deposit box :yellow_square: 
* Audio :yellow_square:
    * Music :yellow_square:
        * Playing music :heavy_check_mark:
        * Music Regions :x:
        * Music Player tab :x:
    * Sounds :yellow_square:
        * Playing sounds :heavy_check_mark:
        * Sound effects for actions :yellow_square:
* Climbing ladders :yellow_square:
* Climbing stairs :yellow_square:
* Lumbridge mill :yellow_square:
    * Replacing objects for local player only :x:
    * Grain in hopper :heavy_check_mark:
    * Operating levers :heavy_check_mark:
    * Removing flour if and only if grain has been processed :heavy_check_mark:
* Cow milking :heavy_check_mark:
* Container filling
    * Buckets :heavy_check_mark:
    * Jugs :heavy_check_mark:
    * Wells :heavy_check_mark:
    * Sinks :heavy_check_mark:
    * Fountains :heavy_check_mark:
    * Emptying Containers :heavy_check_mark:
* Home Teleport :yellow_square:
    * Animation :yellow_square:
* Emotes :yellow_square:
    * Skillcape :yellow_square:
    * Normal emotes :heavy_check_mark:
* Shops :yellow_square: 
    * Shop logic :heavy_check_mark:
    * World Shops :yellow_square:
        * Al Kahrid gem trader :heavy_check_mark:
        * Louie Armoured legs :heavy_check_mark:
        * Dommik craftin shop :heavy_check_mark:
        * Raneal Super skirt :heavy_check_mark:
        * Bob's axes :heavy_check_mark:
* Intentory :yellow_square: 
    * Swap Items :heavy_check_mark:
    * Drop Item :heavy_check_mark:
    * Pickup item :heavy_check_mark:
    * Equip item :yellow_square: 
        * Complete equiment stats and slot info :yellow_square: 
        * Wielding logic (Weight, Stats, Equipping) :heavy_check_mark:
* Pickables :heavy_check_mark:
    * Wheat :heavy_check_mark:
    * Flax :heavy_check_mark:
    * Potato :heavy_check_mark:
    * Onion :heavy_check_mark:
    * Cabbage :heavy_check_mark:
* Doors :yellow_square: 
    * Door logic :heavy_check_mark:
    * Door ids :yellow_square: 
* Clue Scrolls :x:

### Skills

* Combat :yellow_square:
    * Melee :x:
    * Ranged :x:
    * Magic :x:
* Prayer :x:
* Cooking :x:
* Fletching :x:
* Fishing :x:
* Firemaking :yellow_square:
* Herblore :x:
* Agility :x:
* Thieving :x:
* Slayer :x:
* Farming :x:
* Runecraft :x:
* Construction :x:


* Woodcutting :yellow_square: 
    * Formula for success :heavy_check_mark:
    * Chopping Trees :heavy_check_mark: 
    * Axes :heavy_check_mark:
    * Birds nests  :heavy_check_mark: 
    * Stump ids :yellow_square: 
    * Canoes :x:
* Mining 
    * Formula for success :heavy_check_mark:
    * Mining ores :heavy_check_mark: 
    * Pickaxes :heavy_check_mark:
    * Random gems  :heavy_check_mark: 
    * Gem ores :heavy_check_mark:
    * Essence mining :heavy_check_mark:
    * Empty Rock ids :yellow_square: 
* Crafting
    * Spinning wheel :heavy_check_mark:
* Smithing
    * Smelting ore to bars :heavy_check_mark:
    * Forging :yellow_square:
        * Correct items :heavy_check_mark:
        * Hiding non applicable items :yellow_square: 
    
### Quests
* Cook's Assistant :heavy_check_mark:

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
