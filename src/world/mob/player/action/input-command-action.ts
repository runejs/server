import { Player } from '../player';
import { logger } from '@runejs/logger/dist/logger';
import { gameCache, injectPlugins, world } from '@server/game-server';
import { npcAction } from '@server/world/mob/player/action/npc-action';
import { Skill } from '@server/world/mob/skills';
import { Position } from '@server/world/position';

type commandHandler = (player: Player, args?: string[]) => void;

const commands: { [key: string]: commandHandler } = {

    pos: (player: Player) => {
        player.packetSender.chatboxMessage(`@[ ${player.position.x}, ${player.position.y}, ${player.position.level} ]`);
    },

    move: (player: Player, args: string[]) => {
        if(args.length < 2 || args.length > 3) {
            throw `move x y [level]`;
        }

        const x: number = parseInt(args[0], 10);
        const y: number = parseInt(args[1], 10);
        let level: number = 0;

        if(args.length === 3) {
            level = parseInt(args[2]);
        }

        if(isNaN(x) || isNaN(y) || isNaN(level)) {
            throw `move x y [level]`;
        }

        player.teleport(new Position(x, y, level));
    },

    give: (player: Player, args: string[]) => {
        if(args.length < 1) {
            throw `give itemId [amount?]`;
        }

        const inventorySlot = player.inventory.getFirstOpenSlot();

        if(inventorySlot === -1) {
            player.packetSender.chatboxMessage(`You don't have enough free space to do that.`);
            return;
        }

        const itemId: number = parseInt(args[0]);

        if(isNaN(itemId)) {
            throw `give itemId [amount?]`;
        }

        let amount = 1;
        if(args.length === 2) {
            amount = parseInt(args[1]);
            if(isNaN(amount) || amount < 1 || amount > 5000) {
                amount = 1;
            }
        }

        const itemDefinition = gameCache.itemDefinitions.get(itemId);
        if(!itemDefinition) {
            player.packetSender.chatboxMessage(`Item ID ${itemId} not found!`);
            return;
        }

        player.packetSender.chatboxMessage(`amount = ${amount}`);
        let actualAmount = 0;
        if(itemDefinition.stackable) {
            const item = { itemId, amount };
            player.giveItem(item);
            actualAmount = amount;
        } else {
            for(let i = 0; i < amount; i++) {
                if(player.giveItem({ itemId, amount: 1 })) {
                    actualAmount++;
                } else {
                    break;
                }
            }
        }

        player.packetSender.chatboxMessage(`Added ${actualAmount}x ${itemDefinition.name} to inventory.`);
    },

    npcaction: (player: Player) => {
        npcAction(player, world.npcList[0], world.npcList[0].position, 'talk-to');
    },

    chati: (player: Player, args: string[]) => {
        if(args.length !== 1) {
            throw `chati interfaceId`;
        }

        const interfaceId: number = parseInt(args[0]);

        if(isNaN(interfaceId)) {
            throw `chati interfaceId`;
        }

        player.packetSender.showChatboxInterface(interfaceId);
    },

    sound: (player, args) => {
        if(args.length !== 1 && args.length !== 2) {
            throw `sound soundId [volume?]`;
        }

        const soundId: number = parseInt(args[0]);

        if(isNaN(soundId)) {
            throw `sound soundId [volume?]`;
        }

        let volume: number = 0;

        if(args.length === 2) {
            volume = parseInt(args[1]);

            if(isNaN(volume)) {
                throw `sound soundId volume`;
            }
        }

        player.packetSender.playSound(soundId, volume);
    },

    plugins: player => {
        player.packetSender.chatboxMessage('Reloading plugins...');

        injectPlugins()
            .then(() => player.packetSender.chatboxMessage('Plugins reloaded.'))
            .catch(() => player.packetSender.chatboxMessage('Error reloading plugins.'));
    },

    exptest: player => {
        player.skills.addExp(Skill.WOODCUTTING, 420);
    },

    song: (player, args) => {
        if(args.length !== 1) {
            throw `song songId`;
        }

        const songId: number = parseInt(args[0]);

        if(isNaN(songId)) {
            throw `song songId`;
        }

        player.packetSender.playSong(songId);
    },

    quicksong: (player, args) => {
        if(args.length !== 1 && args.length !== 2) {
            throw `quicksong songId [previousSongId?]`;
        }

        const songId: number = parseInt(args[0]);

        if(isNaN(songId)) {
            throw `quicksong songId [previousSongId?]`;
        }

        let previousSongId: number = 76;

        if(args.length === 2) {
            previousSongId = parseInt(args[1]);

            if(isNaN(previousSongId)) {
                throw `quicksong songId [previousSongId?]`;
            }
        }

        player.packetSender.playQuickSong(songId, previousSongId);
    },

    anim: (player, args) => {
        if(args.length !== 1) {
            throw `anim animationId`;
        }

        const animationId: number = parseInt(args[0]);

        if(isNaN(animationId)) {
            throw `anim animationId`;
        }

        player.playAnimation(animationId);
    },

};

export const inputCommandAction = (player: Player, command: string, args: string[]): void => {
    if(commands.hasOwnProperty(command)) {
        try {
            commands[command](player, args);
        } catch(invalidSyntaxError) {
            player.packetSender.chatboxMessage(`Invalid command syntax, try ::${invalidSyntaxError}`);
        }
    } else {
        logger.info(`Unhandled command ${command} with arguments ${JSON.stringify(args)}.`);
    }
};
