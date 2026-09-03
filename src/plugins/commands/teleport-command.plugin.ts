import type { commandActionHandler } from '@engine/action/pipe/player-command.action';
import { activeWorld } from '@engine/world';
import { Position } from '@engine/world/position';

const action: commandActionHandler = details => {
  const { player, args } = details;

  const x = args.XorPlayerName;

  if (typeof x === 'string') {
    const playerWithName = activeWorld.findPlayer(x);
    if (playerWithName) {
      player.teleport(playerWithName.position);
      return;
    }
  }

  const xCoord: number = typeof x === 'string' ? parseInt(x, 10) : x;

  if (isNaN(xCoord)) {
    return;
  }
  const y: number = args.y as number;
  const level: number = args.level as number;

  player.teleport(new Position(xCoord, y, level));
};

const goUpAction: commandActionHandler = details => {
  const { player } = details;

  player.teleport(new Position(player.position.x, player.position.y, player.position.level + 1));
};

const goDownAction: commandActionHandler = details => {
  const { player } = details;

  if (player.position.level > 0) {
    player.teleport(new Position(player.position.x, player.position.y, player.position.level - 1));
  }
};

const setLevelCommand: commandActionHandler = details => {
  const { player, args } = details;
  const level: number = args.level as number;
  if (!isNaN(level) && level >= 0 && level <= 255) {
    player.teleport(new Position(player.position.x, player.position.y, level));
  }
}

export default {
  pluginId: 'rs:teleport_command_plugin',
  hooks: [
    {
      type: 'player_command',
      commands: [ 'move', 'goto', 'teleport', 'tele', 'moveto', 'setpos' ],
      args: [
        {
          name: 'XorPlayerName',
          type: 'string',
        },
        {
          name: 'y',
          type: 'number',
          defaultValue: 3222,
        },
        {
          name: 'level',
          type: 'number',
          defaultValue: 0,
        },
      ],
      handler: action,
    },
    {
      type: 'player_command',
      commands: [ 'up', 'goup' ],
      handler: goUpAction,
    },
    {
      type: 'player_command',
      commands: [ 'down', 'godown' ],
      handler: goDownAction,
    },
    {
      type: 'player_command',
      commands: [ 'setheightlevel', 'heightlevel', 'hl' ],
      args: [
        {
          name: 'level',
          type: 'number',
        },
      ],
      handler: setLevelCommand,
    }
  ],
};
