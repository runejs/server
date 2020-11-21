import { directionData, WNES } from '@server/world/direction';
import { objectAction } from '@server/world/action/object-action';
import { soundIds } from '@server/world/config/sound-ids';
import { LocationObject } from '@runejs/cache-parser';

// @TODO move to yaml config
const doors = [
    {
        closed: 1530,
        open: 1531,
        hinge: 'RIGHT'
    },
    {
        closed: 1533,
        open: 1534,
        hinge: 'RIGHT'
    },
    {
        closed: 1516,
        open: 1517,
        hinge: 'LEFT'
    },
    {
        closed: 1519,
        open: 1520,
        hinge: 'RIGHT'
    },
    {
        closed: 1536,
        open: 1537,
        hinge: 'LEFT'
    },
    {
        closed: 11993,
        open: 11994,
        hinge: 'RIGHT'
    }
];

const leftHingeDir: { [key: string]: string } = {
    'NORTH': 'WEST',
    'SOUTH': 'EAST',
    'WEST': 'SOUTH',
    'EAST': 'NORTH'
};
const rightHingeDir: { [key: string]: string } = {
    'NORTH': 'EAST',
    'SOUTH': 'WEST',
    'WEST': 'NORTH',
    'EAST': 'SOUTH'
};

export const action: objectAction = ({ player, object: door, position, cacheOriginal }): void => {
    let opening = true;
    let doorConfig = doors.find(d => d.closed === door.objectId);
    let hingeConfig;
    let replacementDoorId: number;
    if(!doorConfig) {
        doorConfig = doors.find(d => d.open === door.objectId);
        if(!doorConfig) {
            return;
        }

        opening = false;
        hingeConfig = doorConfig.hinge === 'LEFT' ? rightHingeDir : leftHingeDir;
        replacementDoorId = doorConfig.closed;
    } else {
        hingeConfig = doorConfig.hinge === 'LEFT' ? leftHingeDir : rightHingeDir;
        replacementDoorId = doorConfig.open;
    }

    const startDir = WNES[door.orientation];
    const endDir = hingeConfig[startDir];
    const endPosition = position.step(opening ? 1 : -1, opening ? startDir : endDir);

    const replacementDoor: LocationObject = {
        objectId: replacementDoorId,
        x: endPosition.x,
        y: endPosition.y,
        level: position.level,
        type: door.type,
        orientation: directionData[endDir].rotation
    };

    player.instance.toggleGameObjects(replacementDoor, door, !cacheOriginal);
    // 70 = close gate, 71 = open gate, 62 = open door, 60 = close door
    player.playSound(opening ? soundIds.openDoor : soundIds.closeDoor, 7);
};

export default { type: 'object_action', objectIds: [1530, 4465, 4467, 3014, 3017, 3018,
    3019, 1536, 1537, 1533, 1531, 1534, 12348, 11993, 11994], options: [ 'open', 'close' ], walkTo: true, action };
