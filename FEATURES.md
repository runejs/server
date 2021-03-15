[![RuneJS Discord Server](https://img.shields.io/discord/678751302297059336?label=RuneJS%20Discord&logo=discord)](https://discord.gg/5P74nSh)


![RuneJS](https://i.imgur.com/pmkdSfc.png)

# RuneJS Feature List

## Game Server

* RSA + ISAAC ciphering :heavy_check_mark:
* Game Update Server :heavy_check_mark:
* Authentication Server :heavy_check_mark:
* Server side cache loading :heavy_check_mark:
    * Client pathing validation via cache mapdata :heavy_check_mark:
    * Item/object/npc definitions :heavy_check_mark:
* Packet queueing  :heavy_check_mark:

### Technical Features

* Asynchronous server infrastructure w/ Promises & RxJS Observables
* A diverse TypeScript plugin system for easily writing new content based off of in-game actions
* A simplified JavaScript plugin system for quickly and easily bootstrapping game content
* Flexible quest and dialogue systems for more advanced content development
* Code compilation via Babel, offering more seamless compilation and redeployment of plugins

## Game World

* Private & group Player Instances :heavy_check_mark:
* Personal player instance objects and world items :heavy_check_mark:
* Bank :heavy_check_mark:
    * Withdraw/Deposit 1,5,10,All :heavy_check_mark:
    * As note  :heavy_check_mark:
    * Swap slot :heavy_check_mark:
    * Insert mode: :heavy_check_mark:
    * Deposit box :heavy_check_mark:
* Audio :yellow_square:
    * Music :yellow_square:
        * Playing music :heavy_check_mark:
        * Music Regions :x:
        * Music Player tab :x:
    * Sounds :yellow_square:
        * Playing sounds :heavy_check_mark:
        * Sound effects for actions :yellow_square:
* Home Teleport :heavy_check_mark:
* Emotes :heavy_check_mark:
    * Skillcape emotes :heavy_check_mark:
    * Unlockable emotes w/ requirements :heavy_check_mark:
* Shop support :heavy_check_mark:
* Inventory support :heavy_check_mark:
    * Swapping items :heavy_check_mark:
    * Dropping items :heavy_check_mark:
    * Picking up ground items :heavy_check_mark:
    * Equipping items :heavy_check_mark:
* Doors/gates :yellow_square:
    * NSEW doors :heavy_check_mark:
    * Diagonal doors :yellow_square:
    * Double doors :heavy_check_mark:
    * Wooden gates :heavy_check_mark:
* Climbing ladders & stairs :yellow_square:
* Clue Scrolls :x:

### Quests
* Cook's Assistant :heavy_check_mark:

### Skills

* Combat :yellow_square:
    * Melee :yellow_square:
    * Ranged :x:
    * Magic :x:
* Prayer :x:
* Cooking :x:
* Fletching :x:
* Fishing :x:
* Firemaking :yellow_square:
    * Fire lighting :yellow_square:
    * Chain fires w/ movement :yellow_square:
* Herblore :x:
* Agility :x:
* Thieving :x:
* Slayer :x:
* Farming :x:
* Runecrafting :x:
* Construction :x:
* Woodcutting :yellow_square:
    * Formula for success :heavy_check_mark:
    * Chopping Trees :heavy_check_mark:
    * Axes :heavy_check_mark:
    * Birds nests  :heavy_check_mark:
    * Stump ids :yellow_square:
    * Canoes :x:
* Mining :yellow_square:
    * Formula for success :heavy_check_mark:
    * Mining ores :heavy_check_mark:
    * Pickaxes :heavy_check_mark:
    * Random gems  :heavy_check_mark:
    * Gem ores :heavy_check_mark:
    * Essence mining :heavy_check_mark:
    * Empty Rock ids :yellow_square:
* Crafting :yellow_square:
    * Spinning wheel :heavy_check_mark:
* Smithing :yellow_square:
    * Smelting ore to bars :heavy_check_mark:
    * Forging :yellow_square:
        * Correct items :heavy_check_mark:
        * Hiding non-applicable items :yellow_square:
