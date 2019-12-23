import { DefinitionIndex } from '../cache-indices';
import { CacheArchive } from '../cache-archive';

export interface ItemDefinition {
    id: number;
    name: string;
    description: string;
    stackable: boolean;
    value: number;
    members: boolean;
    groundOptions: string[];
    inventoryOptions: string[];
    notedVersionOf: number;
    teamIndex: number;
}

export function parseItemDefinitions(indices: DefinitionIndex[], archive: CacheArchive): Map<number, ItemDefinition> {
    const buffer = archive.getFileData('obj.dat');
    const itemDefinitions: Map<number, ItemDefinition> = new Map<number, ItemDefinition>();

    indices.forEach(cacheIndex => {
        buffer.setReaderIndex(cacheIndex.offset);

        let name: string;
        let description: string;
        let stackable: boolean = false;
        let value: number = -1;
        let members: boolean = false;
        let groundOptions: string[];
        let inventoryOptions: string[];
        let notedVersionOf: number = -1;
        let teamIndex: number = -1;

        while(true) {
            const opcode = buffer.readUnsignedByte();

            if(opcode === 0) {
                break;
            }

            switch(opcode) {
                case 1:
                    buffer.readShortBE(); // Model ID
                    break;
                case 2:
                    name = buffer.readString();
                    break;
                case 3:
                    description = buffer.readString();
                    break;
                case 4: case 5: case 6: case 7: case 8: case 9: case 10:
                    buffer.readShortBE(); // 4:InventoryZoom, 5:InventoryRotY, 6:InventoryRotX, 7,8,9,10 ???
                    break;
                case 11:
                    stackable = true;
                    break;
                case 12:
                    value = buffer.readIntBE();
                    break;
                case 16:
                    members = true;
                    break;
                case 23:
                    buffer.readShortBE(); // Male Equip Model
                    buffer.readByte(); // ???
                    break;
                case 24:
                    buffer.readShortBE(); // Male Arm Model
                    break;
                case 25:
                    buffer.readShortBE(); // Female Equip Model
                    buffer.readByte(); // ???
                    break;
                case 26:
                    buffer.readShortBE(); // Female Arm Model
                    break;
                case 30: case 31: case 32: case 33: case 34:
                    if(!groundOptions) groundOptions = new Array(5);
                    let groundOption = buffer.readString();
                    if(groundOption === 'hidden') groundOption = null;
                    groundOptions[opcode - 30] = groundOption;
                    break;
                case 35: case 36: case 37: case 38: case 39:
                    if(!inventoryOptions) inventoryOptions = new Array(5);
                    inventoryOptions[opcode - 35] = buffer.readString();
                    break;
                case 40:
                    const colorCount = buffer.readUnsignedByte();
                    for(let color = 0; color < colorCount; color++) {
                        buffer.readShortBE(); // Old Model Color (unsigned short)
                        buffer.readShortBE(); // New Model Color (unsigned short)
                    }
                    break;
                case 78: case 79: case 90: case 91: case 92: case 93: case 95:
                    buffer.readShortBE(); // More model stuff
                    break;
                case 97:
                    notedVersionOf = buffer.readUnsignedShortBE();
                    break;
                case 98:
                    buffer.readShortBE(); // Noted Item Template Index/ID
                    break;
                case 100: case 101: case 102: case 103: case 104: case 105: case 106: case 107: case 108: case 109:
                    buffer.readShortBE(); // ??? item stack stuff?
                    buffer.readShortBE(); // ??? item stack stuff?
                    break;
                case 110: case 111: case 112:
                    buffer.readShortBE(); // Model size x/y/z
                    break;
                case 113: case 114:
                    buffer.readByte(); // Light/shadow modifier
                    break;
                case 115:
                    teamIndex = buffer.readUnsignedByte();
                    break;
            }
        };

        if(notedVersionOf !== -1) {
            if(itemDefinitions.has(notedVersionOf)) {
                const originalItem = itemDefinitions.get(notedVersionOf);

                name = originalItem.name;
                value = originalItem.value;
                members = originalItem.members;
                stackable = true;

                const nameFirstChar = name.toUpperCase().charAt(0);
                const word = (nameFirstChar == 'A' || nameFirstChar == 'E' || nameFirstChar == 'I' || nameFirstChar == 'O' || nameFirstChar == 'U') ? 'an' : 'a';

                description = `Swap this note at any bank for ${word} ${name}.`;
            }
        }

        itemDefinitions.set(cacheIndex.id, {
            id: cacheIndex.id, name, description, stackable, value, members, groundOptions, inventoryOptions, notedVersionOf, teamIndex
        });
    });

    return itemDefinitions;
}
