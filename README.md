# Rune.JS

Rune.JS is a RuneScape game server written entirely using TypeScript and JavaScript. The aim of this project is to create a game server that is both fun and easy to use, while also providing simple content development systems.

Currently the server is set up for the 377 revision of the game. There are not any plans to convert it to other versions at this time, though that could very well change. Any regular 377 client with RSA enabled should work with Rune.JS. 

## Features

- Login & packet handling.
- Multiplayer support.
- Basic item inventory implementation.
- Player pathing validation via collision and tile maps generated from the game cache.
- A basic REST service for polling logged in users.

## Cache Parsing

A separate package was created that Rune.JS uses to parse the 377 game cache. This package parses item definitions, landscape object definitions, map region tiles, and map region landscape objects. The Rune.JS `cache-parser` package can be found here:

- [Github: rune-js/cache-parser](https://github.com/rune-js/cache-parser)
- [NPM: @runejs/cache-parser](https://www.npmjs.com/package/@runejs/cache-parser)

## Usage

To run the game server and accompanying REST service, first clone the repo and install node dependencies via `npm install`. Once the dependencies are installed, the server can be run via `npm run server`. The game server will spin up and be accessible via port `43594`. The REST service can be accessed via port `8888`.

## REST API

Online players can be polled via the REST protocol for web applications. An accompanying server control panel UI is panned utilizing VueJS that will point to this REST service.

##### API Endpoints:

- `/players` : Returns a list of players currently logged into the game server.
