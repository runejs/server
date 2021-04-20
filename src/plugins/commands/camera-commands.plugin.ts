import { commandActionHandler } from '@engine/world/action/player-command.action';
import { Position } from '@engine/world/position';


const moveCameraAction: commandActionHandler = ({ player, args }) => {
    const { x, y, height, speed, acceleration } = args;
    player.outgoingPackets.snapCameraTo(new Position(x as number, y as number, player.position.level),
        height as number, speed as number, acceleration as number);
};

const turnCameraAction: commandActionHandler = ({ player, args }) => {
    const { x, y, height, speed, acceleration } = args;
    player.outgoingPackets.turnCameraTowards(new Position(x as number, y as number, player.position.level),
        height as number, speed as number, acceleration as number);
};

const lookCameraAction: commandActionHandler = ({ player, args }) => {
    const { cameraX, cameraY, cameraHeight, lookX, lookY, lookHeight, speed, acceleration } = args;
    player.outgoingPackets.snapCameraTo(new Position(cameraX as number, cameraY as number, player.position.level),
        cameraHeight as number, speed as number, acceleration as number);
    player.outgoingPackets.turnCameraTowards(new Position(lookX as number, lookY as number, player.position.level),
        lookHeight as number, speed as number, acceleration as number);
};

const lookTestAction: commandActionHandler = ({ player }) => {
    const cameraX = 3219;
    const cameraY = 3238;
    const cameraHeight = 500;
    const lookX = 3219;
    const lookY = 3250;
    const lookHeight = 500;
    const speed = 3;
    const acceleration = 50;

    player.outgoingPackets.snapCameraTo(new Position(cameraX, cameraY), cameraHeight, speed, acceleration);
    player.outgoingPackets.turnCameraTowards(new Position(lookX, lookY), lookHeight, speed, acceleration);
};

export default {
    pluginId: 'rs:camera_commands',
    hooks: [
        {
            type: 'player_command',
            commands: [ 'looktest', 'lt' ],
            handler: lookTestAction
        }, {
            type: 'player_command',
            commands: [ 'cameralook' ],
            args: [
                {
                    name: 'cameraX',
                    type: 'number'
                },
                {
                    name: 'cameraY',
                    type: 'number'
                },
                {
                    name: 'cameraHeight',
                    type: 'number'
                },
                {
                    name: 'lookX',
                    type: 'number'
                },
                {
                    name: 'lookY',
                    type: 'number'
                },
                {
                    name: 'lookHeight',
                    type: 'number'
                },
                {
                    name: 'speed',
                    type: 'number',
                    defaultValue: 0
                },
                {
                    name: 'acceleration',
                    type: 'number',
                    defaultValue: 100
                }
            ],
            handler: lookCameraAction
        }, {
            type: 'player_command',
            commands: [ 'mcam', 'movecamera', 'move_camera', 'setcam', 'setcamera', 'set_camera' ],
            args: [
                {
                    name: 'x',
                    type: 'number'
                },
                {
                    name: 'y',
                    type: 'number'
                },
                {
                    name: 'height',
                    type: 'number'
                },
                {
                    name: 'speed',
                    type: 'number',
                    defaultValue: 0
                },
                {
                    name: 'acceleration',
                    type: 'number',
                    defaultValue: 100
                }
            ],
            handler: moveCameraAction
        }, {
            type: 'player_command',
            commands: [ 'tcam', 'turncamera', 'turn_camera' ],
            args: [
                {
                    name: 'x',
                    type: 'number'
                },
                {
                    name: 'y',
                    type: 'number'
                },
                {
                    name: 'height',
                    type: 'number'
                },
                {
                    name: 'speed',
                    type: 'number',
                    defaultValue: 0
                },
                {
                    name: 'acceleration',
                    type: 'number',
                    defaultValue: 100
                }
            ],
            handler: turnCameraAction
        }
    ]
};
